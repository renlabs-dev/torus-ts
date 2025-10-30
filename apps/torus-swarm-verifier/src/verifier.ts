import { AsyncLocalStorage } from "node:async_hooks";
import type { DB, Transaction } from "@torus-ts/db/client";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type {
  PostSlice,
  ScrapedTweet,
  VerdictContext,
} from "@torus-ts/db/schema";
import { and, asc, eq, inArray, notExists, sql } from "drizzle-orm";
import { logger } from "./index";
import { sleep } from "./utils";

const workerContext = new AsyncLocalStorage<{ workerId: number }>();

function logInfo(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.info(prefix ? `${prefix} ${formatted}` : formatted);
}

function logError(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.error(prefix ? `${prefix} ${formatted}` : formatted);
}

type PredictionTweet = Omit<
  ScrapedTweet,
  "updatedAt" | "createdAt" | "deletedAt"
>;

/**
 * Timeframe extraction response from Gemini
 */
interface TimeframeExtractionResult {
  timeframe_status:
    | "explicit"
    | "implicit"
    | "inferred"
    | "event_trigger"
    | "missing";
  start_utc: string | null;
  end_utc: string | null;
  precision:
    | "hour"
    | "day"
    | "week"
    | "month"
    | "quarter"
    | "year"
    | "unbounded"
    | "event";
  reasoning: string;
  assumptions: string[];
  confidence: number;
}

/**
 * Filter validation response
 */
interface FilterValidationResult {
  context: string;
  is_valid: boolean;
  reasoning: string;
}

/**
 * Verdict generation response
 */
interface VerdictResult {
  valid: boolean;
  verdict: boolean;
  reasoning: string;
}

/**
 * JSON Schema for TimeframeExtractionResult
 */
const TIMEFRAME_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    timeframe_status: {
      type: "string",
      enum: ["explicit", "implicit", "inferred", "event_trigger", "missing"],
      description: "Classification of how the timeframe was determined",
    },
    start_utc: {
      type: ["string", "null"],
      format: "date-time",
      description:
        "Start time in ISO-8601 UTC format, usually the tweet timestamp",
    },
    end_utc: {
      type: ["string", "null"],
      format: "date-time",
      description: "Deadline for verification in ISO-8601 UTC format",
    },
    precision: {
      type: "string",
      enum: [
        "hour",
        "day",
        "week",
        "month",
        "quarter",
        "year",
        "unbounded",
        "event",
      ],
      description: "Granularity of the timeframe",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of how the timeframe was derived",
    },
    assumptions: {
      type: "array",
      items: {
        type: "string",
      },
      description: "List of assumptions made during extraction",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence score between 0.0 and 1.0",
    },
  },
  required: [
    "timeframe_status",
    "start_utc",
    "end_utc",
    "precision",
    "reasoning",
    "assumptions",
    "confidence",
  ],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for FilterValidationResult
 */
const FILTER_VALIDATION_SCHEMA = {
  type: "object",
  properties: {
    context: {
      type: "string",
      description:
        "Brief summary of what the thread is about and what the author was saying",
    },
    is_valid: {
      type: "boolean",
      description: "Whether this is a valid prediction that should be verified",
    },
    reasoning: {
      type: "string",
      description: "Explanation of why this is or isn't a valid prediction",
    },
  },
  required: ["context", "is_valid", "reasoning"],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for VerdictResult
 */
const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    verdict: {
      type: "boolean",
      description: "Whether the prediction came true",
    },
    reasoning: {
      type: "string",
      description:
        "Brief explanation of why the prediction came true or false, citing specific sources and dates",
    },
  },
  required: ["verdict", "reasoning"],
  additionalProperties: false,
} as const;

/**
 * Configuration for the Prediction Verifier worker
 */
export interface PredictionVerifierConfig {
  /** Number of workers to run concurrently (default: 3) */
  concurrency?: number;
  /** Enable debug logging */
  debugMode?: boolean;
  /** OpenRouter API key for LLM calls */
  openrouterApiKey: string;
  /** Timeframe extraction prompt template */
  timeframePrompt: string;
  /** Filter validation prompt template */
  filterValidationPrompt: string;
  /** Verdict generation prompt template */
  verdictPrompt: string;
}

/**
 * Prediction Verifier
 */
export class PredictionVerifier {
  private readonly config: Required<PredictionVerifierConfig>;

  private db: DB;

  constructor(config: PredictionVerifierConfig, db: DB) {
    this.config = {
      concurrency: config.concurrency ?? 3,
      debugMode: config.debugMode ?? false,
      openrouterApiKey: config.openrouterApiKey,
      timeframePrompt: config.timeframePrompt,
      filterValidationPrompt: config.filterValidationPrompt,
      verdictPrompt: config.verdictPrompt,
    };

    this.db = db;
  }

  /**
   * Fetches the next prediction that needs verification.
   * Returns the oldest parsed prediction that does not have a verdict or feedback.
   */
  async getNextPredictionToVerify(tx: Transaction): Promise<
    | {
        id: string;
        predictionId: string;
        sourceTweetId: bigint;
        conversationId: bigint | null;
        goal: unknown;
        timeframe: unknown;
        llmConfidence: string;
        vagueness: string | null;
        topicId: string | null;
        context: unknown;
        filterAgentId: string | null;
      }
    | undefined
  > {
    const predictions = await tx
      .select({
        id: parsedPredictionSchema.id,
        predictionId: parsedPredictionSchema.predictionId,
        sourceTweetId: scrapedTweetSchema.id,
        conversationId: scrapedTweetSchema.conversationId,
        goal: parsedPredictionSchema.goal,
        timeframe: parsedPredictionSchema.timeframe,
        llmConfidence: parsedPredictionSchema.llmConfidence,
        vagueness: parsedPredictionSchema.vagueness,
        topicId: parsedPredictionSchema.topicId,
        context: parsedPredictionSchema.context,
        filterAgentId: parsedPredictionSchema.filterAgentId,
      })
      .from(parsedPredictionSchema)
      .innerJoin(
        scrapedTweetSchema,
        eq(
          scrapedTweetSchema.predictionId,
          parsedPredictionSchema.predictionId,
        ),
      )
      .where(
        and(
          notExists(
            tx
              .select()
              .from(verdictSchema)
              .where(
                eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
              ),
          ),
          notExists(
            tx
              .select()
              .from(parsedPredictionFeedbackSchema)
              .where(
                eq(
                  parsedPredictionFeedbackSchema.parsedPredictionId,
                  parsedPredictionSchema.id,
                ),
              ),
          ),
          notExists(
            tx
              .select()
              .from(twitterScrapingJobsSchema)
              .where(
                eq(
                  twitterScrapingJobsSchema.conversationId,
                  scrapedTweetSchema.conversationId,
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(parsedPredictionSchema.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    return predictions[0];
  }

  /**
   * Fetches one tweet with the given ID.
   */
  async fetchSinglePredictionTweet(
    tx: Transaction,
    tweetId: bigint,
  ): Promise<PredictionTweet[]> {
    return await tx
      .select({
        id: scrapedTweetSchema.id,
        text: scrapedTweetSchema.text,
        authorId: scrapedTweetSchema.authorId,
        date: scrapedTweetSchema.date,
        conversationId: scrapedTweetSchema.conversationId,
        parentTweetId: scrapedTweetSchema.parentTweetId,
      })
      .from(scrapedTweetSchema)
      .where(eq(scrapedTweetSchema.id, tweetId));
  }

  /**
   * Extracts text from PostSlices by concatenating the referenced text ranges.
   */
  private extractSliceText(
    slices: PostSlice[],
    tweetMap: Map<bigint, PredictionTweet>,
  ): string {
    return slices
      .map((slice) => {
        const tweet = tweetMap.get(BigInt(slice.source.tweet_id));
        if (!tweet) return "";
        return tweet.text.substring(slice.start, slice.end);
      })
      .join(" ");
  }

  /**
   * Stores feedback for predictions that failed validation.
   */
  private async storeFeedback(
    tx: Transaction,
    parsedPredictionId: string,
    validationStep: string,
    reason: string,
  ): Promise<void> {
    await tx.insert(parsedPredictionFeedbackSchema).values({
      parsedPredictionId,
      validationStep,
      reason,
    });

    logInfo("Stored prediction feedback", {
      parsedPredictionId,
      validationStep,
      reason: reason.substring(0, 100),
    });
  }

  /**
   * Stores verdict in the database.
   */
  private async storeVerdict(
    tx: Transaction,
    parsedPredictionId: string,
    verdictResult: VerdictResult,
  ): Promise<void> {
    const context: VerdictContext = {
      feedback: verdictResult.reasoning,
    };

    await tx.insert(verdictSchema).values({
      parsedPredictionId: parsedPredictionId,
      verdict: verdictResult.verdict,
      context: context,
    });

    logInfo("Created verdict record", {
      parsedPredictionId,
      verdict: verdictResult.verdict,
    });
  }

  /**
   * Calls OpenRouter API with Grok to generate verdict using web search.
   */
  private async generateVerdict(
    context: string,
    goalText: string,
    timeframeText: string,
    timeframeResult: TimeframeExtractionResult,
  ): Promise<VerdictResult> {
    const inputData = {
      context,
      goal_text: goalText,
      timeframe_text: timeframeText,
      timeframe_parsed: {
        start_utc: timeframeResult.start_utc,
        end_utc: timeframeResult.end_utc,
        precision: timeframeResult.precision,
      },
    };

    const userPrompt = JSON.stringify(inputData, null, 2);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "x-ai/grok-4-fast",
          messages: [
            {
              role: "system",
              content: this.config.verdictPrompt,
            },
            {
              role: "user",
              content: `Generate verdict for this prediction:\n\n${userPrompt}`,
            },
          ],
          temperature: 0.1,
          plugins: [{ id: "web" }],
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    const jsonText = result.choices[0]?.message?.content;
    if (!jsonText) {
      throw new Error("No response from OpenRouter API");
    }

    return JSON.parse(jsonText) as VerdictResult;
  }

  /**
   * Calls OpenRouter API to validate filter extraction quality.
   */
  private async validateFilterExtraction(
    goalText: string,
    timeframeText: string,
    goalSlices: PostSlice[],
    timeframeSlices: PostSlice[],
    tweets: PredictionTweet[],
    timeframeResult: TimeframeExtractionResult,
  ): Promise<FilterValidationResult> {
    const threadTweets = tweets.map((t) => ({
      tweet_id: t.id.toString(),
      author: `@${t.authorId}`,
      date: t.date.toISOString(),
      text: t.text,
    }));

    const goalSlicesFormatted = goalSlices.map((slice) => ({
      tweet_id: slice.source.tweet_id,
      start: slice.start,
      end: slice.end,
      text: goalText,
    }));

    const timeframeSlicesFormatted = timeframeSlices.map((slice) => ({
      tweet_id: slice.source.tweet_id,
      start: slice.start,
      end: slice.end,
      text: timeframeText,
    }));

    const inputData = {
      current_date: new Date().toISOString(),
      thread_tweets: threadTweets,
      goal_slices: goalSlicesFormatted,
      timeframe_slices: timeframeSlicesFormatted,
      timeframe_parsed: {
        start_utc: timeframeResult.start_utc,
        end_utc: timeframeResult.end_utc,
        precision: timeframeResult.precision,
      },
    };

    const userPrompt = JSON.stringify(inputData, null, 2);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: this.config.filterValidationPrompt,
            },
            {
              role: "user",
              content: `Validate this prediction extraction:\n\n${userPrompt}`,
            },
          ],
          temperature: 0.1,
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    const jsonText = result.choices[0]?.message?.content;
    if (!jsonText) {
      throw new Error("No response from OpenRouter API");
    }

    return JSON.parse(jsonText) as FilterValidationResult;
  }

  /**
   * Calls OpenRouter API to extract structured timeframe data from prediction text.
   */
  private async extractTimeframe(
    goalText: string,
    timeframeText: string,
    tweetTimestamp: Date,
    tweets: PredictionTweet[],
  ): Promise<TimeframeExtractionResult> {
    const threadContext = tweets
      .map(
        (t) =>
          `Tweet ID: ${t.id.toString()}\n` +
          `Author: @${t.authorId}\n` +
          `Date: ${t.date.toISOString()}\n` +
          `Text: ${t.text}\n`,
      )
      .join("\n---\n\n");

    const currentTime = new Date().toISOString();

    const inputData = {
      timeframe_text: timeframeText,
      goal_text: goalText,
      tweet_timestamp: tweetTimestamp.toISOString(),
      current_time: currentTime,
      thread_context: threadContext,
    };

    const userPrompt = JSON.stringify(inputData, null, 2);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: this.config.timeframePrompt,
            },
            {
              role: "user",
              content: `Extract the timeframe from this prediction:\n\n${userPrompt}`,
            },
          ],
          temperature: 0.1,
          // response_format: {
          //   type: "json_schema",
          //   json_schema: {
          //     name: "timeframe_extraction",
          //     strict: true,
          //     schema: TIMEFRAME_EXTRACTION_SCHEMA,
          //   },
          // },
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    const jsonText = result.choices[0]?.message?.content;
    if (!jsonText) {
      throw new Error("No response from OpenRouter API");
    }

    return JSON.parse(jsonText) as TimeframeExtractionResult;
  }

  /**
   * Validates that all PostSlices reference valid tweets and indices.
   * Returns true if valid, false otherwise.
   */
  private validatePostSlices(
    slices: PostSlice[],
    tweetMap: Map<bigint, PredictionTweet>,
    sliceType: string,
  ): boolean {
    if (slices.length === 0) {
      logInfo(`${sliceType} slices are empty`);
      return false;
    }

    for (const slice of slices) {
      const tweetId = slice.source.tweet_id;
      const tweet = tweetMap.get(BigInt(tweetId));

      if (!tweet) {
        logInfo(`${sliceType} slice references missing tweet`, {
          tweetId,
        });
        return false;
      }

      if (slice.start < 0 || slice.end < 0) {
        logInfo(`${sliceType} slice has negative indices`, {
          tweetId,
          start: slice.start,
          end: slice.end,
        });
        return false;
      }

      if (slice.start >= slice.end) {
        logInfo(`${sliceType} slice has invalid range`, {
          tweetId,
          start: slice.start,
          end: slice.end,
        });
        return false;
      }

      const sliceLength = slice.end - slice.start;
      if (sliceLength < 2) {
        logInfo(`${sliceType} slice too short (minimum 2 characters)`, {
          tweetId,
          length: sliceLength,
        });
        return false;
      }

      if (slice.end > tweet.text.length) {
        logInfo(`${sliceType} slice end index out of bounds`, {
          tweetId,
          end: slice.end,
          textLength: tweet.text.length,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Fetches all tweets in the given conversation.
   */
  async fetchConversationTweets(
    tx: Transaction,
    conversationId: bigint,
  ): Promise<PredictionTweet[]> {
    return await tx
      .select({
        id: scrapedTweetSchema.id,
        text: scrapedTweetSchema.text,
        authorId: scrapedTweetSchema.authorId,
        date: scrapedTweetSchema.date,
        conversationId: scrapedTweetSchema.conversationId,
        parentTweetId: scrapedTweetSchema.parentTweetId,
      })
      .from(scrapedTweetSchema)
      .where(eq(scrapedTweetSchema.conversationId, conversationId));
  }

  /**
   * Traverses parent reply chain starting from a tweet to build the thread.
   * Returns tweets in order from root to the target tweet.
   */
  private buildReplyChain(
    tweetId: bigint,
    allTweets: Map<bigint, PredictionTweet>,
  ): PredictionTweet[] {
    const chain = [];
    let currentId: bigint | null = tweetId;

    while (currentId !== null) {
      const tweet = allTweets.get(currentId);
      if (!tweet) break;

      chain.unshift(tweet);
      currentId = tweet.parentTweetId || null;
    }

    return chain;
  }

  /**
   * Fetches and organizes all tweet data needed for prediction verification.
   * Returns sorted list of tweets from the relevant reply branch.
   */
  async fetchPredictionTweets(
    tx: Transaction,
    sourceTweetId: bigint,
    conversationId: bigint,
  ): Promise<PredictionTweet[]> {
    const allConversationTweets = await this.fetchConversationTweets(
      tx,
      conversationId,
    );

    const tweetMap = new Map(allConversationTweets.map((t) => [t.id, t]));
    const replyChain = this.buildReplyChain(sourceTweetId, tweetMap);

    return replyChain.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /**
   * Processes the next prediction that needs verification.
   * This is the main entry point for verification work.
   */
  async processNextPrediction(tx: Transaction): Promise<boolean> {
    const prediction = await this.getNextPredictionToVerify(tx);
    if (!prediction) {
      return false;
    }

    logInfo("Found prediction to verify", {
      id: prediction.id,
      predictionId: prediction.predictionId,
      sourceTweetId: prediction.sourceTweetId.toString(),
    });

    const tweets = prediction.conversationId
      ? await this.fetchPredictionTweets(
          tx,
          prediction.sourceTweetId,
          prediction.conversationId,
        )
      : await this.fetchSinglePredictionTweet(tx, prediction.sourceTweetId);

    if (tweets.length === 0) {
      logInfo("Source tweet not found in database");
      return true;
    }

    logInfo("Fetched tweets for prediction", {
      count: tweets.length,
      tweetIds: tweets.map((t) => t.id.toString()).join(","),
    });

    const tweetMap = new Map(tweets.map((t) => [t.id, t]));
    const goal = prediction.goal as PostSlice[];
    const timeframe = prediction.timeframe as PostSlice[];

    if (!this.validatePostSlices(goal, tweetMap, "Goal")) {
      logInfo("Goal slices validation failed");
      await this.storeFeedback(
        tx,
        prediction.id,
        "slice_validation",
        "Goal slices validation failed: invalid structure or references",
      );
      return true;
    }

    if (!this.validatePostSlices(timeframe, tweetMap, "Timeframe")) {
      logInfo("Timeframe slices validation failed");
      await this.storeFeedback(
        tx,
        prediction.id,
        "slice_validation",
        "Timeframe slices validation failed: invalid structure or references",
      );
      return true;
    }

    logInfo("PostSlices validated successfully");

    const goalText = this.extractSliceText(goal, tweetMap);
    const timeframeText = this.extractSliceText(timeframe, tweetMap);

    logInfo("Extracted slice text", {
      goalLength: goalText.length,
      timeframeLength: timeframeText.length,
      goal: goalText,
      timeframe: timeframeText,
    });

    const sourceTweet = tweets.find((t) => t.id === prediction.sourceTweetId);
    if (!sourceTweet) {
      logInfo("Source tweet not found in fetched tweets");
      return true;
    }

    const timeframeResult = await this.extractTimeframe(
      goalText,
      timeframeText,
      sourceTweet.date,
      tweets,
    );

    logInfo("Timeframe extracted", {
      status: timeframeResult.timeframe_status,
      startUtc: timeframeResult.start_utc,
      endUtc: timeframeResult.end_utc,
      confidence: timeframeResult.confidence,
    });

    const validationResult = await this.validateFilterExtraction(
      goalText,
      timeframeText,
      goal,
      timeframe,
      tweets,
      timeframeResult,
    );

    logInfo("Filter validation completed", {
      isValid: validationResult.is_valid,
      context: validationResult.context.substring(0, 100),
    });

    if (!validationResult.is_valid) {
      logInfo("Prediction marked as invalid by filter validation", {
        reasoning: validationResult.reasoning,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "filter_validation",
        validationResult.reasoning,
      );
      return true;
    }

    const verdictResult = await this.generateVerdict(
      validationResult.context,
      goalText,
      timeframeText,
      timeframeResult,
    );

    logInfo("Verdict generated", {
      valid: verdictResult.valid,
      verdict: verdictResult.verdict,
      reasoning: verdictResult.reasoning.substring(0, 150),
    });

    if (!verdictResult.valid) {
      logInfo("Prediction marked as invalid by verdict generation", {
        reasoning: verdictResult.reasoning,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "verdict_validation",
        verdictResult.reasoning,
      );
      return true;
    }

    await this.storeVerdict(tx, prediction.id, verdictResult);

    logInfo("Verdict stored successfully", {
      parsedPredictionId: prediction.id,
      predictionId: prediction.predictionId,
      verdict: verdictResult.verdict,
    });

    return true;
  }

  /**
   * Worker loop that polls for predictions and processes them continuously.
   * Backs off exponentially on failures.
   */
  private async runWorker(
    workerId: number,
    stopHook: () => boolean,
  ): Promise<void> {
    await workerContext.run({ workerId }, async () => {
      let consecutiveFailures = 0;
      const maxBackoff = 1000 * 60 * 30;

      logInfo("Worker started");

      while (!stopHook()) {
        try {
          const progress = await this.db.transaction(
            async (tx) => await this.processNextPrediction(tx),
          );

          consecutiveFailures = 0;

          if (!progress) {
            logInfo("No predictions to verify, waiting 1 minute");
            await sleep(1000 * 60);
          }
        } catch (e) {
          consecutiveFailures++;

          logError("Verifier failed", { error: String(e) });

          const backoffTime = Math.min(
            1000 * 60 * Math.pow(2, consecutiveFailures - 1),
            maxBackoff,
          );
          logInfo("Backing off", {
            seconds: backoffTime / 1000,
            failureCount: consecutiveFailures,
          });
          await sleep(backoffTime);
        }
      }

      logInfo("Worker stopped");
    });
  }

  /**
   * Starts multiple concurrent workers that process predictions in parallel.
   */
  async runVerifier(stopHook: () => boolean): Promise<void> {
    const workers = Array.from({ length: this.config.concurrency }, (_, i) =>
      this.runWorker(i + 1, stopHook),
    );

    await Promise.all(workers);
  }
}
