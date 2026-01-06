import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { OpenRouterClient } from "../ai/openrouter-client";
import type {
  ClaimablePrediction,
  ClaimSource,
  PostSlice,
  PredictionContext,
  PredictionTweet,
  SwarmApiClient,
} from "../api-client";
import {
  FilterValidationSchema,
  TimeframeExtractionSchema,
  VerdictSchema,
} from "../schemas/llm-response";
import type {
  FilterValidationResult,
  TimeframeExtractionResult,
  VerdictResult,
} from "../schemas/llm-response";

const logger = BasicLogger.create({ name: "swarm-verifier:verifier" });

type SliceValidationFailureCause =
  | "EMPTY_SLICES"
  | "MISSING_TWEET"
  | "NEGATIVE_INDICES"
  | "INVALID_RANGE"
  | "SLICE_TOO_SHORT"
  | "OUT_OF_BOUNDS";

interface SliceValidationResult {
  valid: boolean;
  failureCause?: SliceValidationFailureCause;
  message?: string;
}

interface UrlCitation {
  url: string;
  title?: string;
  content?: string;
}

interface PromptLoader {
  getTimeframePrompt(): string;
  getFilterValidationPrompt(): string;
  getVerdictPrompt(): string;
}

export interface PredictionVerifierConfig {
  llmClient: OpenRouterClient;
  promptLoader: PromptLoader;
  apiClient: SwarmApiClient;
}

/**
 * Processes predictions through LLM validation and generates claims/feedback.
 * Matches swarm-filter's PredictionExtractor pattern.
 */
export class PredictionVerifier {
  private llmClient: OpenRouterClient;
  private promptLoader: PromptLoader;
  private apiClient: SwarmApiClient;

  public stats = {
    predictionsProcessed: 0,
    claimsSubmitted: 0,
    feedbackSubmitted: 0,
    errors: 0,
  };

  constructor(config: PredictionVerifierConfig) {
    this.llmClient = config.llmClient;
    this.promptLoader = config.promptLoader;
    this.apiClient = config.apiClient;
  }

  private extractSliceText(
    slices: PostSlice[],
    tweetMap: Map<string, PredictionTweet>,
  ): string {
    return slices
      .map((slice) => {
        const tweet = tweetMap.get(slice.source.tweet_id);
        if (!tweet) return "";
        return tweet.text.substring(slice.start, slice.end);
      })
      .join(" ");
  }

  private validatePostSlices(
    slices: PostSlice[],
    tweetMap: Map<string, PredictionTweet>,
    sliceType: string,
  ): SliceValidationResult {
    if (slices.length === 0) {
      return {
        valid: false,
        failureCause: "EMPTY_SLICES",
        message: `${sliceType} slices are empty`,
      };
    }

    for (const slice of slices) {
      const tweetId = slice.source.tweet_id;
      const tweet = tweetMap.get(tweetId);

      if (!tweet) {
        return {
          valid: false,
          failureCause: "MISSING_TWEET",
          message: `${sliceType} slice references missing tweet ${tweetId}`,
        };
      }

      if (slice.start < 0 || slice.end < 0) {
        return {
          valid: false,
          failureCause: "NEGATIVE_INDICES",
          message: `${sliceType} slice has negative indices`,
        };
      }

      if (slice.start >= slice.end) {
        return {
          valid: false,
          failureCause: "INVALID_RANGE",
          message: `${sliceType} slice has invalid range`,
        };
      }

      if (slice.end - slice.start < 2) {
        return {
          valid: false,
          failureCause: "SLICE_TOO_SHORT",
          message: `${sliceType} slice too short`,
        };
      }

      if (slice.end > tweet.text.length) {
        return {
          valid: false,
          failureCause: "OUT_OF_BOUNDS",
          message: `${sliceType} slice exceeds tweet length`,
        };
      }
    }

    return { valid: true };
  }

  private async extractTimeframe(
    targetText: string,
    timeframeText: string,
    tweetTimestamp: Date,
    tweets: PredictionTweet[],
  ): Promise<TimeframeExtractionResult> {
    const threadContext = tweets
      .map(
        (t) =>
          `Tweet ID: ${t.id}\n` +
          `Author: ${t.authorUsername ? `@${t.authorUsername}` : "unknown"}\n` +
          `Date: ${t.date}\n` +
          `Text: ${t.text}\n`,
      )
      .join("\n---\n\n");

    const inputData = {
      timeframe_text: timeframeText,
      target_text: targetText,
      tweet_timestamp: tweetTimestamp.toISOString(),
      current_time: new Date().toISOString(),
      thread_context: threadContext,
    };

    const userPrompt = `Extract the timeframe from this prediction:\n\n${JSON.stringify(inputData, null, 2)}`;

    return this.llmClient.completeStructured(
      this.promptLoader.getTimeframePrompt(),
      userPrompt,
      TimeframeExtractionSchema,
      { temperature: 0.1 },
    );
  }

  private async validateFilterExtraction(
    targetText: string,
    timeframeText: string,
    targetSlices: PostSlice[],
    timeframeSlices: PostSlice[],
    tweets: PredictionTweet[],
    timeframeResult: TimeframeExtractionResult,
  ): Promise<FilterValidationResult> {
    const threadTweets = tweets.map((t) => ({
      tweet_id: t.id,
      author: t.authorUsername ? `@${t.authorUsername}` : "unknown",
      date: t.date,
      text: t.text,
    }));

    const inputData = {
      current_date: new Date().toISOString(),
      thread_tweets: threadTweets,
      target_slices: targetSlices.map((slice) => ({
        tweet_id: slice.source.tweet_id,
        start: slice.start,
        end: slice.end,
        text: targetText,
      })),
      timeframe_slices: timeframeSlices.map((slice) => ({
        tweet_id: slice.source.tweet_id,
        start: slice.start,
        end: slice.end,
        text: timeframeText,
      })),
      timeframe_parsed: {
        start_utc: timeframeResult.start_utc,
        end_utc: timeframeResult.end_utc,
        precision: timeframeResult.precision,
      },
    };

    const userPrompt = `Validate this prediction extraction:\n\n${JSON.stringify(inputData, null, 2)}`;

    return this.llmClient.completeStructured(
      this.promptLoader.getFilterValidationPrompt(),
      userPrompt,
      FilterValidationSchema,
      { temperature: 0.1 },
    );
  }

  private async generateVerdict(
    context: string,
    targetText: string,
    timeframeText: string,
    timeframeResult: TimeframeExtractionResult,
  ): Promise<{ verdict: VerdictResult; sources: UrlCitation[] }> {
    const inputData = {
      context,
      target_text: targetText,
      timeframe_text: timeframeText,
      timeframe_parsed: {
        start_utc: timeframeResult.start_utc,
        end_utc: timeframeResult.end_utc,
        precision: timeframeResult.precision,
      },
    };

    const userPrompt = `Generate verdict for this prediction:\n\n${JSON.stringify(inputData, null, 2)}`;

    const verdict = await this.llmClient.completeWithSearch(
      this.promptLoader.getVerdictPrompt(),
      userPrompt,
      VerdictSchema,
      { temperature: 0.1 },
    );

    // Extract sources from LLM response
    const sources: UrlCitation[] = verdict.sources.map((s) => ({
      url: s.url,
      title: s.title,
      content: s.snippet,
    }));

    return { verdict, sources };
  }

  async verifyPrediction(
    prediction: ClaimablePrediction,
  ): Promise<"claim" | "feedback" | null> {
    logger.info(
      `Processing prediction ${prediction.id} (topic: ${prediction.topicName})`,
    );

    let context: PredictionContext;
    try {
      context = await this.apiClient.getPredictionContext(prediction.id);
    } catch (error) {
      logger.error(`Failed to get prediction context: ${String(error)}`);
      this.stats.errors++;
      return null;
    }

    const tweets = context.tweets;

    if (tweets.length === 0) {
      logger.info("No tweets found for prediction, submitting feedback");
      await this.apiClient.submitFeedback(
        prediction.id,
        "OTHER",
        "No tweet data available",
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    const tweetMap = new Map(tweets.map((t) => [t.id, t]));

    const targetValidation = this.validatePostSlices(
      context.target,
      tweetMap,
      "Target",
    );
    if (!targetValidation.valid) {
      logger.info(
        `Target slices validation failed: ${targetValidation.failureCause}`,
      );
      await this.apiClient.submitFeedback(
        prediction.id,
        targetValidation.failureCause ?? "OTHER",
        targetValidation.message ?? "Validation failed",
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    const timeframeValidation = this.validatePostSlices(
      context.timeframe,
      tweetMap,
      "Timeframe",
    );
    if (!timeframeValidation.valid) {
      logger.info(
        `Timeframe slices validation failed: ${timeframeValidation.failureCause}`,
      );
      await this.apiClient.submitFeedback(
        prediction.id,
        timeframeValidation.failureCause ?? "OTHER",
        timeframeValidation.message ?? "Validation failed",
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    const targetText = this.extractSliceText(context.target, tweetMap);
    const timeframeText = this.extractSliceText(context.timeframe, tweetMap);

    const sourceTweet = tweets[0];
    if (!sourceTweet) {
      logger.info("No source tweet available");
      return null;
    }

    const timeframeResult = await this.extractTimeframe(
      targetText,
      timeframeText,
      new Date(sourceTweet.date),
      tweets,
    );

    logger.info(
      `Timeframe: status=${timeframeResult.timeframe_status}, start=${timeframeResult.start_utc}, end=${timeframeResult.end_utc}`,
    );

    if (
      timeframeResult.timeframe_status === "missing" ||
      timeframeResult.timeframe_status === "event_trigger"
    ) {
      const cause =
        timeframeResult.timeframe_status === "missing"
          ? "MISSING_TIMEFRAME"
          : "EVENT_TRIGGER";
      await this.apiClient.submitFeedback(
        prediction.id,
        cause,
        timeframeResult.reasoning,
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    if (timeframeResult.end_utc) {
      const endDate = new Date(timeframeResult.end_utc);
      const oneDayAfterEnd = new Date(endDate);
      oneDayAfterEnd.setDate(oneDayAfterEnd.getDate() + 1);

      if (oneDayAfterEnd > new Date()) {
        logger.info(
          `Timeframe not matured yet (ends ${timeframeResult.end_utc})`,
        );
        await this.apiClient.submitFeedback(
          prediction.id,
          "FUTURE_TIMEFRAME",
          `Prediction timeframe ends on ${timeframeResult.end_utc}. Can be verified after ${oneDayAfterEnd.toISOString()}.`,
        );
        this.stats.feedbackSubmitted++;
        return "feedback";
      }
    }

    const validationResult = await this.validateFilterExtraction(
      targetText,
      timeframeText,
      context.target,
      context.timeframe,
      tweets,
      timeframeResult,
    );

    logger.info(
      `Filter validation: valid=${validationResult.is_valid}, confidence=${validationResult.confidence}`,
    );

    if (!validationResult.is_valid) {
      await this.apiClient.submitFeedback(
        prediction.id,
        validationResult.failure_cause ?? "OTHER",
        validationResult.reasoning,
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    const { verdict: verdictResult, sources } = await this.generateVerdict(
      validationResult.context,
      targetText,
      timeframeText,
      timeframeResult,
    );

    logger.info(
      `Verdict: valid=${verdictResult.valid}, verdict=${verdictResult.verdict}, confidence=${verdictResult.confidence}`,
    );

    if (!verdictResult.valid) {
      await this.apiClient.submitFeedback(
        prediction.id,
        "OTHER",
        verdictResult.reasoning,
      );
      this.stats.feedbackSubmitted++;
      return "feedback";
    }

    const claimSources: ClaimSource[] = sources.map((s) => ({
      url: s.url,
      title: s.title,
      snippet: s.content,
      retrievedAt: new Date().toISOString(),
    }));

    await this.apiClient.submitClaim(
      prediction.id,
      verdictResult.verdict,
      verdictResult.confidence,
      verdictResult.reasoning,
      claimSources,
      {
        startUtc: timeframeResult.start_utc ?? new Date().toISOString(),
        endUtc: timeframeResult.end_utc ?? new Date().toISOString(),
        precision: timeframeResult.precision,
      },
    );

    logger.info(`Claim submitted for prediction ${prediction.id}`);
    this.stats.claimsSubmitted++;
    this.stats.predictionsProcessed++;
    return "claim";
  }
}
