import { AsyncLocalStorage } from "node:async_hooks";
import type { DB, Transaction } from "@torus-ts/db/client";
import {
  parsedPredictionDetailsSchema,
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type {
  FailureCause,
  PostSlice,
  ScrapedTweet,
  VerdictContext,
} from "@torus-ts/db/schema";
import { and, asc, eq, notExists } from "drizzle-orm";
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
 * Slice validation failure reasons
 */
type SliceValidationFailureCause =
  | "EMPTY_SLICES" // No slices provided
  | "MISSING_TWEET" // Slice references a tweet that doesn't exist
  | "NEGATIVE_INDICES" // Start or end index is negative
  | "INVALID_RANGE" // Start >= end (inverted or zero-length range)
  | "SLICE_TOO_SHORT" // Slice length < 2 characters
  | "OUT_OF_BOUNDS"; // End index exceeds tweet text length

/**
 * Result from slice validation
 */
interface SliceValidationResult {
  valid: boolean;
  failureCause?: SliceValidationFailureCause;
  message?: string;
}

/**
 * Filter validation failure reasons
 */
type FilterValidationFailureCause =
  | "BROKEN_EXTRACTION"
  | "VAGUE_GOAL"
  | "PRESENT_STATE"
  | "NEGATION"
  | "SARCASM"
  | "QUOTING_OTHERS"
  | "HEAVY_HEDGING"
  | "FUTURE_TIMEFRAME"
  | "OTHER";

/**
 * Filter validation response
 */
interface FilterValidationResult {
  context: string;
  is_valid: boolean;
  failure_cause: FilterValidationFailureCause | null;
  confidence: number;
  reasoning: string;
}

/**
 * URL citation from OpenRouter web search
 */
interface UrlCitation {
  url: string;
  title?: string;
  content?: string;
  start_index?: number;
  end_index?: number;
}

/**
 * Verdict generation response
 */
interface VerdictResult {
  valid: boolean;
  verdict: boolean;
  confidence: number;
  reasoning: string;
  sources?: UrlCitation[]; // Extracted from OpenRouter annotations
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
    failure_cause: {
      type: ["string", "null"],
      enum: [
        "BROKEN_EXTRACTION",
        "VAGUE_GOAL",
        "PRESENT_STATE",
        "NEGATION",
        "SARCASM",
        "QUOTING_OTHERS",
        "HEAVY_HEDGING",
        "FUTURE_TIMEFRAME",
        "OTHER",
        null,
      ],
      description:
        "Category of failure (null if is_valid is true). BROKEN_EXTRACTION: slices cut through word boundaries or extract nonsensical fragments. VAGUE_GOAL: goal is subjective or unmeasurable. PRESENT_STATE: statement about current conditions, not a prediction. NEGATION: prediction is negated. SARCASM: sarcastic/joking tone. QUOTING_OTHERS: quoting someone else. HEAVY_HEDGING: heavily hedged. FUTURE_TIMEFRAME: prediction hasn't matured yet. OTHER: other disqualifying factors.",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score from 0.0 to 1.0 indicating how certain the validation is",
    },
    reasoning: {
      type: "string",
      description: "Explanation of why this is or isn't a valid prediction",
    },
  },
  required: ["context", "is_valid", "failure_cause", "confidence", "reasoning"],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for VerdictResult
 */
const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    valid: {
      type: "boolean",
      description:
        "Whether this was a legitimate prediction (true) or invalid/news (false)",
    },
    verdict: {
      type: "boolean",
      description: "Whether the prediction came true",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description:
        "Confidence score from 0.0 to 1.0 indicating certainty in the verdict determination",
    },
    reasoning: {
      type: "string",
      description:
        "Brief explanation of why the prediction came true or false, citing specific sources and dates",
    },
  },
  required: ["valid", "verdict", "confidence", "reasoning"],
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
    failureCause?: FailureCause | null,
  ): Promise<void> {
    await tx.insert(parsedPredictionFeedbackSchema).values({
      parsedPredictionId,
      validationStep,
      failureCause: failureCause ?? undefined,
      reason,
    });

    logInfo("Stored prediction feedback", {
      parsedPredictionId,
      validationStep,
      failureCause: failureCause ?? "none",
      reason: reason.substring(0, 100),
    });
  }

  /**
   * Stores timeframe extraction results to parsed_prediction_details.
   * Uses upsert to handle incremental updates.
   */
  private async storeTimeframeDetails(
    tx: Transaction,
    parsedPredictionId: string,
    timeframeResult: TimeframeExtractionResult,
  ): Promise<void> {
    await tx
      .insert(parsedPredictionDetailsSchema)
      .values({
        parsedPredictionId,
        timeframeStatus: timeframeResult.timeframe_status,
        timeframeStartUtc: timeframeResult.start_utc
          ? new Date(timeframeResult.start_utc)
          : undefined,
        timeframeEndUtc: timeframeResult.end_utc
          ? new Date(timeframeResult.end_utc)
          : undefined,
        timeframePrecision: timeframeResult.precision,
        timeframeReasoning: timeframeResult.reasoning,
        timeframeAssumptions: timeframeResult.assumptions,
        timeframeConfidence: timeframeResult.confidence.toString(),
      })
      .onConflictDoUpdate({
        target: parsedPredictionDetailsSchema.parsedPredictionId,
        set: {
          timeframeStatus: timeframeResult.timeframe_status,
          timeframeStartUtc: timeframeResult.start_utc
            ? new Date(timeframeResult.start_utc)
            : undefined,
          timeframeEndUtc: timeframeResult.end_utc
            ? new Date(timeframeResult.end_utc)
            : undefined,
          timeframePrecision: timeframeResult.precision,
          timeframeReasoning: timeframeResult.reasoning,
          timeframeAssumptions: timeframeResult.assumptions,
          timeframeConfidence: timeframeResult.confidence.toString(),
          updatedAt: new Date(),
        },
      });

    logInfo("Stored timeframe details", {
      parsedPredictionId,
      status: timeframeResult.timeframe_status,
      startUtc: timeframeResult.start_utc,
      endUtc: timeframeResult.end_utc,
    });
  }

  /**
   * Stores filter validation context to parsed_prediction_details.
   * Uses upsert to handle incremental updates.
   */
  private async storeFilterValidationContext(
    tx: Transaction,
    parsedPredictionId: string,
    validationResult: FilterValidationResult,
  ): Promise<void> {
    await tx
      .insert(parsedPredictionDetailsSchema)
      .values({
        parsedPredictionId,
        predictionContext: validationResult.context,
        filterValidationConfidence: validationResult.confidence.toString(),
        filterValidationReasoning: validationResult.reasoning,
      })
      .onConflictDoUpdate({
        target: parsedPredictionDetailsSchema.parsedPredictionId,
        set: {
          predictionContext: validationResult.context,
          filterValidationConfidence: validationResult.confidence.toString(),
          filterValidationReasoning: validationResult.reasoning,
          updatedAt: new Date(),
        },
      });

    logInfo("Stored filter validation context", {
      parsedPredictionId,
      contextLength: validationResult.context.length,
      confidence: validationResult.confidence,
    });
  }

  /**
   * Stores verdict details (confidence and sources) to parsed_prediction_details.
   * Uses upsert to handle incremental updates.
   */
  private async storeVerdictDetails(
    tx: Transaction,
    parsedPredictionId: string,
    verdictResult: VerdictResult,
  ): Promise<void> {
    const sourcesData =
      verdictResult.sources && verdictResult.sources.length > 0
        ? verdictResult.sources.map((s) => ({
            url: s.url,
            title: s.title,
            content: s.content,
          }))
        : undefined;

    await tx
      .insert(parsedPredictionDetailsSchema)
      .values({
        parsedPredictionId,
        verdictConfidence: verdictResult.confidence.toString(),
        verdictSources: sourcesData,
      })
      .onConflictDoUpdate({
        target: parsedPredictionDetailsSchema.parsedPredictionId,
        set: {
          verdictConfidence: verdictResult.confidence.toString(),
          verdictSources: sourcesData,
          updatedAt: new Date(),
        },
      });

    logInfo("Stored verdict details", {
      parsedPredictionId,
      confidence: verdictResult.confidence,
      sourcesCount: verdictResult.sources?.length ?? 0,
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
          // response_format: {
          //   type: "json_schema",
          //   json_schema: {
          //     name: "verdict_generation",
          //     strict: true,
          //     schema: VERDICT_SCHEMA,
          //   },
          // },
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
      choices: {
        message: {
          content: string;
          annotations?: {
            type: string;
            url_citation?: {
              url: string;
              title?: string;
              content?: string;
              start_index?: number;
              end_index?: number;
            };
          }[];
        };
      }[];
    };

    const message = result.choices[0]?.message;
    if (!message?.content) {
      throw new Error("No response from OpenRouter API");
    }

    const verdictResult = JSON.parse(message.content) as VerdictResult;

    const sources: UrlCitation[] | undefined =
      message.annotations
        ?.filter((ann) => ann.type === "url_citation" && ann.url_citation)
        // eslint-disable-next-line
        .map((ann) => ann.url_citation!!) ?? undefined;

    return {
      ...verdictResult,
      sources: sources && sources.length > 0 ? sources : undefined,
    };
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
            type: "json_schema",
            json_schema: {
              name: "filter_validation",
              strict: true,
              schema: FILTER_VALIDATION_SCHEMA,
            },
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
      choices: {
        message: {
          content: string;
        };
      }[];
    };

    const jsonText = result.choices[0]?.message.content;
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
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "timeframe_extraction",
              strict: true,
              schema: TIMEFRAME_EXTRACTION_SCHEMA,
            },
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
      choices: {
        message: {
          content: string;
        };
      }[];
    };

    const jsonText = result.choices[0]?.message.content;
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
  ): SliceValidationResult {
    if (slices.length === 0) {
      const message = `${sliceType} slices are empty`;
      logInfo(message);
      return {
        valid: false,
        failureCause: "EMPTY_SLICES",
        message,
      };
    }

    for (const slice of slices) {
      const tweetId = slice.source.tweet_id;
      const tweet = tweetMap.get(BigInt(tweetId));

      if (!tweet) {
        const message = `${sliceType} slice references missing tweet ${tweetId}`;
        logInfo(message);
        return {
          valid: false,
          failureCause: "MISSING_TWEET",
          message,
        };
      }

      if (slice.start < 0 || slice.end < 0) {
        const message = `${sliceType} slice has negative indices (start: ${slice.start}, end: ${slice.end})`;
        logInfo(message, { tweetId });
        return {
          valid: false,
          failureCause: "NEGATIVE_INDICES",
          message,
        };
      }

      if (slice.start >= slice.end) {
        const message = `${sliceType} slice has invalid range (start: ${slice.start}, end: ${slice.end})`;
        logInfo(message, { tweetId });
        return {
          valid: false,
          failureCause: "INVALID_RANGE",
          message,
        };
      }

      const sliceLength = slice.end - slice.start;
      if (sliceLength < 2) {
        const message = `${sliceType} slice too short (${sliceLength} characters, minimum 2)`;
        logInfo(message, { tweetId });
        return {
          valid: false,
          failureCause: "SLICE_TOO_SHORT",
          message,
        };
      }

      if (slice.end > tweet.text.length) {
        const message = `${sliceType} slice end index ${slice.end} exceeds tweet text length ${tweet.text.length}`;
        logInfo(message, { tweetId });
        return {
          valid: false,
          failureCause: "OUT_OF_BOUNDS",
          message,
        };
      }
    }

    return { valid: true };
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

    const goalValidation = this.validatePostSlices(goal, tweetMap, "Goal");
    if (!goalValidation.valid) {
      logInfo("Goal slices validation failed", {
        failureCause: goalValidation.failureCause,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "slice_validation",
        goalValidation.message ?? "Goal slices validation failed",
        goalValidation.failureCause,
      );
      return true;
    }

    const timeframeValidation = this.validatePostSlices(
      timeframe,
      tweetMap,
      "Timeframe",
    );
    if (!timeframeValidation.valid) {
      logInfo("Timeframe slices validation failed", {
        failureCause: timeframeValidation.failureCause,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "slice_validation",
        timeframeValidation.message ?? "Timeframe slices validation failed",
        timeframeValidation.failureCause,
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

    await this.storeTimeframeDetails(tx, prediction.id, timeframeResult);

    if (
      timeframeResult.timeframe_status === "missing" ||
      timeframeResult.timeframe_status === "event_trigger"
    ) {
      logInfo("Timeframe is unverifiable", {
        status: timeframeResult.timeframe_status,
        reasoning: timeframeResult.reasoning,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "timeframe_extraction",
        timeframeResult.reasoning,
        timeframeResult.timeframe_status === "missing"
          ? "MISSING_TIMEFRAME"
          : "EVENT_TRIGGER",
      );
      return true;
    }

    if (timeframeResult.end_utc) {
      const endDate = new Date(timeframeResult.end_utc);
      const currentDate = new Date();

      if (endDate > currentDate) {
        logInfo("Timeframe has not matured yet", {
          endUtc: timeframeResult.end_utc,
          currentDate: currentDate.toISOString(),
        });
        await this.storeFeedback(
          tx,
          prediction.id,
          "timeframe_extraction",
          `Prediction timeframe ends on ${timeframeResult.end_utc} which is after the current date ${currentDate.toISOString()}. Prediction has not matured yet and cannot be verified.`,
          "FUTURE_TIMEFRAME",
        );
        return true;
      }
    }

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
      confidence: validationResult.confidence,
    });

    await this.storeFilterValidationContext(
      tx,
      prediction.id,
      validationResult,
    );

    if (!validationResult.is_valid) {
      logInfo("Prediction marked as invalid by filter validation", {
        failureCause: validationResult.failure_cause,
        reasoning: validationResult.reasoning,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "filter_validation",
        validationResult.reasoning,
        validationResult.failure_cause,
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
      confidence: verdictResult.confidence,
      sourcesCount: verdictResult.sources?.length ?? 0,
      reasoning: verdictResult.reasoning.substring(0, 150),
    });

    await this.storeVerdictDetails(tx, prediction.id, verdictResult);

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
