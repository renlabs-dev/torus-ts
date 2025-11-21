import type { RouterInputs, RouterOutputs } from "@torus-ts/api";
import {
  getContextSchemaForTopic,
  omitContextMetadata,
} from "@torus-ts/db/schema";
import { blake2AsHex } from "@polkadot/util-crypto";
import canonicalize from "canonicalize";
import he from "he";
import { z } from "zod";
import type { PromptLoader } from "../ai/prompt-loader";
import {
  createLLMPredictionResponseSchema,
  PredictionCheckSchema,
  transformToPostSliceArray,
} from "../schemas/llm-response";

/**
 * Interface for LLM clients that can perform structured completions
 */
export interface LLMClient {
  completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodType<T>,
  ): Promise<T>;
}

export interface PredictionExtractorConfig {
  predictionCheckClient: LLMClient;
  topicClassificationClient: LLMClient;
  extractionClient: LLMClient;
  promptLoader: PromptLoader;
  signHash: (hash: string) => Promise<string>;
  signerAddress: string;
}

type TweetsNextResponse = RouterOutputs["prophet"]["getTweetsNext"];
type TweetsArray = TweetsNextResponse["tweets"];
type TweetWithContext = TweetsArray[number];
type TweetData = TweetWithContext["main"];
type StorePredictionsInput = RouterInputs["prophet"]["storePredictions"];
type ExtractedPrediction = StorePredictionsInput[number];

/**
 * Prediction Extractor Service
 *
 * Processes tweets through LLM to extract predictions.
 * ONLY interacts with OpenRouter - no database operations.
 * All database operations should be done via tRPC router.
 */
export class PredictionExtractor {
  private predictionCheckClient: LLMClient;
  private topicClassificationClient: LLMClient;
  private extractionClient: LLMClient;
  private promptLoader: PromptLoader;
  private signHash: (hash: string) => Promise<string>;
  private signerAddress: string;

  // Public stats for tracking
  public stats = {
    tweetsFiltered: 0, // Rejected in step 1 (prediction check)
    noPredictionInExtraction: 0, // Passed step 1 but extraction returned has_prediction=false
    lowQuality: 0, // Quality score <= 50
  };

  constructor(config: PredictionExtractorConfig) {
    this.predictionCheckClient = config.predictionCheckClient;
    this.topicClassificationClient = config.topicClassificationClient;
    this.extractionClient = config.extractionClient;
    this.promptLoader = config.promptLoader;
    this.signHash = config.signHash;
    this.signerAddress = config.signerAddress;
  }

  /**
   * Process a batch of tweets with context
   *
   * @param tweetsArray - Array of {main, context} from tRPC
   * @returns Array of extracted predictions with transformed PostSlices
   */
  async processTweetsBatch(
    tweetsArray: TweetsArray,
  ): Promise<ExtractedPrediction[]> {
    const extracted: ExtractedPrediction[] = [];

    for (const item of tweetsArray) {
      try {
        const prediction = await this.extractPrediction(
          item.main,
          item.context,
        );
        if (prediction) {
          extracted.push(prediction);
        }
      } catch (error) {
        console.error(`Failed to process tweet ${item.main.id}:`, error);
        // Continue processing other tweets
      }
    }

    return extracted;
  }

  /**
   * Check if a tweet has a prediction using cheap model (fast filter).
   *
   * @param mainTweet - Main tweet to check
   * @param contextTweets - Context tweets for additional context
   * @returns True if prediction exists, false if filtered out
   */
  private async checkHasPrediction(
    mainTweet: TweetData,
    contextTweets: Record<string, TweetData>,
  ): Promise<boolean> {
    const { system, user } = this.promptLoader.loadAndSubstitute(
      "check-has-prediction",
      {
        tweet_text: mainTweet.text,
        context_tweets:
          Object.keys(contextTweets).length > 0
            ? Object.entries(contextTweets)
                .map(([id, t]) => `${id}: ${t.text}`)
                .join("\n")
            : "None",
      },
    );

    // Use structured output for reliable binary classification
    const response = await this.predictionCheckClient.completeStructured(
      system,
      user,
      PredictionCheckSchema,
    );

    if (response.has_prediction) {
      console.log(`✓ Step 1 PASS - Tweet ${mainTweet.id}:`);
      console.log(`  ${mainTweet.text}`);
    }

    return response.has_prediction;
  }

  /**
   * Classify the topic of a tweet using a cheap model.
   *
   * @param mainTweet - Main tweet to classify
   * @param contextTweets - Context tweets for additional context
   * @returns Topic name (e.g., "crypto", "technology", "business")
   */
  private async classifyTopic(
    mainTweet: TweetData,
    contextTweets: Record<string, TweetData>,
  ): Promise<string> {
    const TopicClassificationSchema = z.object({
      topic: z.string().min(1),
    });

    const { system, user } = this.promptLoader.loadAndSubstitute(
      "classify-topic",
      {
        tweet_text: mainTweet.text,
        context_tweets:
          Object.keys(contextTweets).length > 0
            ? Object.entries(contextTweets)
                .map(([id, t]) => `${id}: ${t.text}`)
                .join("\n")
            : "",
      },
    );

    const response = await this.topicClassificationClient.completeStructured(
      system,
      user,
      TopicClassificationSchema,
    );

    return response.topic;
  }

  /**
   * Extract prediction from a single tweet with its context
   *
   * @param mainTweet - Main tweet being analyzed
   * @param contextTweets - Context tweets (parents, retweets, thread)
   * @returns Extracted prediction or null if no prediction found
   */
  async extractPrediction(
    mainTweet: TweetData,
    contextTweets: Record<string, TweetData>,
  ): Promise<ExtractedPrediction | null> {
    // Decode HTML entities for clean LLM input
    const decodedMainText = he.decode(mainTweet.text);
    const decodedContextTweets: Record<string, TweetData> = {};
    for (const [tweetId, tweet] of Object.entries(contextTweets)) {
      decodedContextTweets[tweetId] = {
        ...tweet,
        text: he.decode(tweet.text),
      };
    }

    const hasPrediction = await this.checkHasPrediction(
      mainTweet,
      contextTweets,
    );
    if (!hasPrediction) {
      console.log(`Tweet ${mainTweet.id} filtered out (no prediction)`);
      this.stats.tweetsFiltered++;
      return null;
    }

    // Step 1: Classify topic with cheap model
    const topic = await this.classifyTopic(mainTweet, contextTweets);
    console.log(`Classified tweet ${mainTweet.id} as topic: ${topic}`);

    // Step 2: Select context schema based on topic
    const contextSchema = getContextSchemaForTopic(topic);
    const contextSchemaForLLM = omitContextMetadata(contextSchema);

    // Step 3: Create LLM response schema (LLM fills fields without version/schema_type)
    const LLMResponseSchemaForLLM =
      createLLMPredictionResponseSchema(contextSchemaForLLM);

    // Step 4: Create parser schema (parses LLM output and adds defaults for version/schema_type)
    const LLMResponseSchemaForParsing =
      createLLMPredictionResponseSchema(contextSchema);

    // Load and substitute prompt variables
    const { system, user } = this.promptLoader.loadAndSubstitute(
      "extract-predictions",
      {
        tweet_id: mainTweet.id,
        tweet_text: decodedMainText,
        author_username: mainTweet.authorId,
        tweet_date: mainTweet.date.toISOString(),
        context_tweets: JSON.stringify(decodedContextTweets, null, 2),
      },
    );

    // Step 5: Call LLM with omitted schema (no version/schema_type in JSON Schema)
    const llmResponseRaw = await this.extractionClient.completeStructured(
      system,
      user,
      LLMResponseSchemaForLLM,
    );

    // Step 6: Parse with full schema to add version/schema_type defaults
    const llmResponse = LLMResponseSchemaForParsing.parse(llmResponseRaw);

    // If no prediction found, return null
    if (!llmResponse.has_prediction) {
      console.log(`No prediction found in tweet ${mainTweet.id}`);
      this.stats.noPredictionInExtraction++;
      return null;
    }

    // Discriminated union ensures all required fields exist when has_prediction = true
    const predictionData = llmResponse.prediction_data;

    // Filter out low quality predictions
    if (predictionData.predictionQuality <= 50) {
      console.log(
        `Low quality prediction (${predictionData.predictionQuality}/100) rejected for tweet ${mainTweet.id}`,
      );
      this.stats.lowQuality++;
      return null;
    }

    console.log(`Successfully extracted prediction from tweet ${mainTweet.id}`);

    // Build map of tweet IDs to decoded tweet texts
    const tweetTexts: Record<string, string> = {
      [mainTweet.id]: decodedMainText,
    };
    for (const [tweetId, tweet] of Object.entries(decodedContextTweets)) {
      tweetTexts[tweetId] = tweet.text;
    }

    // Transform LLM text slices to database format with character indices
    const target = transformToPostSliceArray(predictionData.target, tweetTexts);
    const timeframe = transformToPostSliceArray(
      predictionData.timeframe,
      tweetTexts,
    );

    // Log crypto tickers and tokens if this is a crypto prediction
    if (predictionData.context.schema_type === "crypto") {
      console.log(
        `Crypto prediction for tweet ${mainTweet.id} - Tokens: ${predictionData.context.tokens.join(", ")}, Tickers: ${predictionData.context.tickers.join(", ")}`,
      );
    }

    // Return extracted data in format expected by tRPC storePredictions
    const content = {
      tweetId: mainTweet.id,
      sentAt: new Date().toISOString(),
      prediction: {
        target,
        timeframe,
        topicName: topic,
        predictionQuality: predictionData.predictionQuality,
        briefRationale: predictionData.briefRationale,
        llmConfidence: predictionData.llmConfidence,
        vagueness: predictionData.vagueness ?? null,
        context: predictionData.context,
      },
    };

    // Hash the content and sign it (using canonical JSON)
    const contentCanonical = canonicalize(content);
    if (!contentCanonical) {
      throw new Error("Failed to canonicalize content");
    }
    const contentHash = blake2AsHex(contentCanonical);
    const signature = await this.signHash(contentHash);

    return {
      content,
      metadata: {
        signature,
        version: 1,
      },
    };
  }
}
