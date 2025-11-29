import { AsyncLocalStorage } from "node:async_hooks";
import type { DB, Transaction } from "@torus-ts/db/client";
import {
  parsedPredictionDetailsSchema,
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  twitterUsersSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type {
  FailureCause,
  PostSlice,
  ScrapedTweet,
  VerdictContext,
} from "@torus-ts/db/schema";
import { and, asc, eq, lt, notExists, sql } from "drizzle-orm";
import { logger } from "./logger";
import { sleep } from "./utils";

const workerContext = new AsyncLocalStorage<{ workerId: number }>();

function groupSlicesByTweet(slices: PostSlice[]): Map<string, PostSlice[]> {
  const byTweet = new Map<string, PostSlice[]>();
  for (const slice of slices) {
    const group = byTweet.get(slice.source.tweet_id);
    if (group) group.push(slice);
    else byTweet.set(slice.source.tweet_id, [slice]);
  }
  return byTweet;
}

interface Range {
  start: number;
  end: number;
}

/** Sorts ranges by start position and merges overlapping/adjacent ones into unified spans. */
function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const first = sorted[0];
  if (!first) return [];

  const merged: Range[] = [first];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (!current || !last) continue;

    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Calculates what fraction of slices1's character span is covered by slices2. Groups
 * slices by tweet, merges overlapping ranges within each group, then sums intersection
 * lengths. Handles fragmented slices that collectively cover the same content.
 */
function calculateCoverageAwareOverlap(
  slices1: PostSlice[],
  slices2: PostSlice[],
): number {
  if (slices1.length === 0 || slices2.length === 0) {
    return 0;
  }

  const slicesByTweet1 = groupSlicesByTweet(slices1);
  const slicesByTweet2 = groupSlicesByTweet(slices2);

  let totalCoveredLength = 0;
  let totalLength1 = 0;

  for (const [tweetId, tweet1Slices] of slicesByTweet1) {
    const tweet2Slices = slicesByTweet2.get(tweetId) ?? [];

    const merged1 = mergeRanges(
      tweet1Slices.map((s) => ({ start: s.start, end: s.end })),
    );
    const merged2 = mergeRanges(
      tweet2Slices.map((s) => ({ start: s.start, end: s.end })),
    );

    for (const r1 of merged1) {
      const r1Length = r1.end - r1.start;
      totalLength1 += r1Length;

      let coveredLength = 0;
      for (const r2 of merged2) {
        const overlapStart = Math.max(r1.start, r2.start);
        const overlapEnd = Math.min(r1.end, r2.end);
        coveredLength += Math.max(0, overlapEnd - overlapStart);
      }

      totalCoveredLength += coveredLength;
    }
  }

  if (totalLength1 === 0) return 0;

  return totalCoveredLength / totalLength1;
}

/**
 * Computes coverage from both directions and returns the MINIMUM. This ensures
 * that extra content in either prediction significantly reduces the similarity
 * score, preventing supersets from being marked as duplicates.
 */
function calculateBidirectionalOverlap(
  slices1: PostSlice[],
  slices2: PostSlice[],
): number {
  const overlap1to2 = calculateCoverageAwareOverlap(slices1, slices2);
  const overlap2to1 = calculateCoverageAwareOverlap(slices2, slices1);

  return Math.min(overlap1to2, overlap2to1);
}

export interface ParsedPredictionForDedup {
  id: string;
  predictionId: string;
  target: PostSlice[];
  timeframe: PostSlice[];
}

export interface PredictionComparisonResult {
  targetScore: number;
  timeframeScore: number;
  isDuplicate: boolean;
}

/**
 * Compares two predictions using bidirectional slice overlap. Both target and
 * timeframe must exceed their thresholds (default 0.96) for a duplicate match.
 */
export function comparePredictions(
  pred1: ParsedPredictionForDedup,
  pred2: ParsedPredictionForDedup,
  targetThreshold = 0.96,
  timeframeThreshold = 0.96,
): PredictionComparisonResult {
  const targetScore = calculateBidirectionalOverlap(pred1.target, pred2.target);
  const timeframeScore = calculateBidirectionalOverlap(
    pred1.timeframe,
    pred2.timeframe,
  );

  return {
    targetScore,
    timeframeScore,
    isDuplicate:
      targetScore >= targetThreshold && timeframeScore >= timeframeThreshold,
  };
}

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
> & {
  authorUsername: string | null;
};

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

type FilterValidationFailureCause =
  | "BROKEN_EXTRACTION"
  | "VAGUE_TARGET"
  | "PRESENT_STATE"
  | "NEGATION"
  | "SARCASM"
  | "QUOTING_OTHERS"
  | "HEAVY_HEDGING"
  | "FUTURE_TIMEFRAME"
  | "SELF_ANNOUNCEMENT"
  | "PERSONAL_ACTION"
  | "OTHER";

interface FilterValidationResult {
  context: string;
  is_valid: boolean;
  failure_cause: FilterValidationFailureCause | null;
  confidence: number;
  reasoning: string;
}

interface UrlCitation {
  url: string;
  title?: string;
  content?: string;
  start_index?: number;
  end_index?: number;
}

interface VerdictResult {
  valid: boolean;
  verdict: boolean;
  confidence: number;
  reasoning: string;
  sources?: UrlCitation[];
}

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
        "VAGUE_TARGET",
        "PRESENT_STATE",
        "NEGATION",
        "SARCASM",
        "QUOTING_OTHERS",
        "HEAVY_HEDGING",
        "FUTURE_TIMEFRAME",
        "SELF_ANNOUNCEMENT",
        "PERSONAL_ACTION",
        "OTHER",
        null,
      ],
      description:
        "Category of failure (null if is_valid is true). BROKEN_EXTRACTION: slices cut through word boundaries or extract nonsensical fragments. VAGUE_TARGET: target is subjective or unmeasurable. PRESENT_STATE: statement about current conditions, not a prediction. NEGATION: prediction is negated. SARCASM: sarcastic/joking tone. QUOTING_OTHERS: quoting someone else. HEAVY_HEDGING: heavily hedged. FUTURE_TIMEFRAME: prediction hasn't matured yet. SELF_ANNOUNCEMENT: author announcing their own actions/products. PERSONAL_ACTION: local/personal actions not publicly verifiable. OTHER: other disqualifying factors.",
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export interface PredictionVerifierConfig {
  concurrency?: number;
  debugMode?: boolean;
  openrouterApiKey: string;
  timeframePrompt: string;
  filterValidationPrompt: string;
  verdictPrompt: string;
}

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

  async getNextPredictionToVerify(tx: Transaction): Promise<
    | {
        id: string;
        predictionId: string;
        sourceTweetId: bigint;
        conversationId: bigint | null;
        target: unknown;
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
        target: parsedPredictionSchema.target,
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
          lt(
            parsedPredictionSchema.createdAt,
            sql`NOW() - INTERVAL '5 minutes'`,
          ),
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
              .from(predictionDuplicateRelationsSchema)
              .where(
                eq(
                  predictionDuplicateRelationsSchema.predictionId,
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

  async fetchSinglePredictionTweet(
    tx: Transaction,
    tweetId: bigint,
  ): Promise<PredictionTweet[]> {
    return await tx
      .select({
        id: scrapedTweetSchema.id,
        text: scrapedTweetSchema.text,
        authorId: scrapedTweetSchema.authorId,
        authorUsername: twitterUsersSchema.username,
        date: scrapedTweetSchema.date,
        conversationId: scrapedTweetSchema.conversationId,
        parentTweetId: scrapedTweetSchema.parentTweetId,
        quotedId: scrapedTweetSchema.quotedId,
        predictionId: scrapedTweetSchema.predictionId,
      })
      .from(scrapedTweetSchema)
      .leftJoin(
        twitterUsersSchema,
        eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
      )
      .where(eq(scrapedTweetSchema.id, tweetId));
  }

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

  private async generateVerdict(
    context: string,
    targetText: string,
    timeframeText: string,
    timeframeResult: TimeframeExtractionResult,
  ): Promise<VerdictResult> {
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

  private async validateFilterExtraction(
    targetText: string,
    timeframeText: string,
    targetSlices: PostSlice[],
    timeframeSlices: PostSlice[],
    tweets: PredictionTweet[],
    timeframeResult: TimeframeExtractionResult,
  ): Promise<FilterValidationResult> {
    const threadTweets = tweets.map((t) => ({
      tweet_id: t.id.toString(),
      author: t.authorUsername ? `@${t.authorUsername}` : `@${t.authorId}`,
      date: t.date.toISOString(),
      text: t.text,
    }));

    const targetSlicesFormatted = targetSlices.map((slice) => ({
      tweet_id: slice.source.tweet_id,
      start: slice.start,
      end: slice.end,
      text: targetText,
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
      target_slices: targetSlicesFormatted,
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

  private async extractTimeframe(
    targetText: string,
    timeframeText: string,
    tweetTimestamp: Date,
    tweets: PredictionTweet[],
  ): Promise<TimeframeExtractionResult> {
    const threadContext = tweets
      .map(
        (t) =>
          `Tweet ID: ${t.id.toString()}\n` +
          `Author: ${t.authorUsername ? `@${t.authorUsername}` : `@${t.authorId}`}\n` +
          `Date: ${t.date.toISOString()}\n` +
          `Text: ${t.text}\n`,
      )
      .join("\n---\n\n");

    const currentTime = new Date().toISOString();

    const inputData = {
      timeframe_text: timeframeText,
      target_text: targetText,
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

  async fetchConversationTweets(
    tx: Transaction,
    conversationId: bigint,
  ): Promise<PredictionTweet[]> {
    return await tx
      .select({
        id: scrapedTweetSchema.id,
        text: scrapedTweetSchema.text,
        authorId: scrapedTweetSchema.authorId,
        authorUsername: twitterUsersSchema.username,
        date: scrapedTweetSchema.date,
        conversationId: scrapedTweetSchema.conversationId,
        parentTweetId: scrapedTweetSchema.parentTweetId,
        quotedId: scrapedTweetSchema.quotedId,
        predictionId: scrapedTweetSchema.predictionId,
      })
      .from(scrapedTweetSchema)
      .leftJoin(
        twitterUsersSchema,
        eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
      )
      .where(eq(scrapedTweetSchema.conversationId, conversationId));
  }

  /** Walks parent pointers from tweetId to the root, returning tweets in root-to-leaf order. */
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

  /** Fetches all parsed predictions associated with the given tweet IDs. */
  private async fetchPredictionsForTweets(
    tx: Transaction,
    tweetIds: bigint[],
  ): Promise<ParsedPredictionForDedup[]> {
    if (tweetIds.length === 0) return [];

    const predictions = await tx
      .select({
        id: parsedPredictionSchema.id,
        predictionId: parsedPredictionSchema.predictionId,
        target: parsedPredictionSchema.target,
        timeframe: parsedPredictionSchema.timeframe,
      })
      .from(parsedPredictionSchema)
      .innerJoin(
        scrapedTweetSchema,
        eq(
          scrapedTweetSchema.predictionId,
          parsedPredictionSchema.predictionId,
        ),
      )
      .where(sql`${scrapedTweetSchema.id} IN ${tweetIds}`);

    return predictions as ParsedPredictionForDedup[];
  }

  /**
   * Runs deduplication on predictions in the tweet tree using union-find clustering.
   * Returns the canonical prediction ID for the given prediction, or null if it's
   * already canonical (unique or the chosen representative of its cluster).
   */
  private findCanonicalPrediction(
    predictionId: string,
    predictions: ParsedPredictionForDedup[],
  ): { canonicalId: string; similarityScore: number } | null {
    if (predictions.length < 2) return null;

    const parent = new Map<string, string>();
    for (const pred of predictions) {
      parent.set(pred.id, pred.id);
    }

    function find(id: string): string {
      const p = parent.get(id);
      if (p === undefined || p === id) return id;
      const root = find(p);
      parent.set(id, root);
      return root;
    }

    function union(id1: string, id2: string): void {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 === root2) return;
      if (root1 < root2) {
        parent.set(root2, root1);
      } else {
        parent.set(root1, root2);
      }
    }

    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        const pred1 = predictions[i];
        const pred2 = predictions[j];
        if (!pred1 || !pred2) continue;

        if (comparePredictions(pred1, pred2).isDuplicate) {
          union(pred1.id, pred2.id);
        }
      }
    }

    const root = find(predictionId);
    if (root === predictionId) return null;

    const canonical = predictions.find((p) => p.id === root);
    if (!canonical) return null;

    const currentPred = predictions.find((p) => p.id === predictionId);
    if (!currentPred) return null;

    const result = comparePredictions(currentPred, canonical);
    return {
      canonicalId: root,
      similarityScore: (result.targetScore + result.timeframeScore) / 2,
    };
  }

  /**
   * Main verification pipeline: validates slices, extracts timeframe via LLM, checks
   * if prediction has matured, validates extraction quality, then generates verdict
   * using web search. Returns false if no work available, true otherwise.
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
    const target = prediction.target as PostSlice[];
    const timeframe = prediction.timeframe as PostSlice[];

    const tweetIds = tweets.map((t) => t.id);
    const predictionsInTree = await this.fetchPredictionsForTweets(
      tx,
      tweetIds,
    );

    const duplicateResult = this.findCanonicalPrediction(
      prediction.id,
      predictionsInTree,
    );

    if (duplicateResult) {
      const canonical = predictionsInTree.find(
        (p) => p.id === duplicateResult.canonicalId,
      );

      const currentTargetText = this.extractSliceText(target, tweetMap);
      const currentTimeframeText = this.extractSliceText(timeframe, tweetMap);
      const canonicalTargetText = canonical
        ? this.extractSliceText(canonical.target, tweetMap)
        : "<not found>";
      const canonicalTimeframeText = canonical
        ? this.extractSliceText(canonical.timeframe, tweetMap)
        : "<not found>";

      logInfo("Prediction is a duplicate, skipping verification", {
        predictionId: prediction.id,
        canonicalId: duplicateResult.canonicalId,
        similarityScore: duplicateResult.similarityScore.toFixed(4),
      });
      logInfo("Duplicate comparison - Current target", {
        text: currentTargetText,
      });
      logInfo("Duplicate comparison - Canonical target", {
        text: canonicalTargetText,
      });
      logInfo("Duplicate comparison - Current timeframe", {
        text: currentTimeframeText,
      });
      logInfo("Duplicate comparison - Canonical timeframe", {
        text: canonicalTimeframeText,
      });

      await tx
        .insert(predictionDuplicateRelationsSchema)
        .values({
          predictionId: prediction.id,
          canonicalId: duplicateResult.canonicalId,
          similarityScore: duplicateResult.similarityScore.toFixed(4),
        })
        .onConflictDoNothing();

      return true;
    }

    const targetValidation = this.validatePostSlices(
      target,
      tweetMap,
      "Target",
    );
    if (!targetValidation.valid) {
      logInfo("Target slices validation failed", {
        failureCause: targetValidation.failureCause,
      });
      await this.storeFeedback(
        tx,
        prediction.id,
        "slice_validation",
        targetValidation.message ?? "Target slices validation failed",
        targetValidation.failureCause,
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

    const targetText = this.extractSliceText(target, tweetMap);
    const timeframeText = this.extractSliceText(timeframe, tweetMap);

    logInfo("Extracted slice text", {
      targetLength: targetText.length,
      timeframeLength: timeframeText.length,
      target: targetText,
      timeframe: timeframeText,
    });

    const sourceTweet = tweets.find((t) => t.id === prediction.sourceTweetId);
    if (!sourceTweet) {
      logInfo("Source tweet not found in fetched tweets");
      return true;
    }

    const timeframeResult = await this.extractTimeframe(
      targetText,
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
      const oneDayAfterEnd = new Date(endDate);
      oneDayAfterEnd.setDate(oneDayAfterEnd.getDate() + 1);

      if (oneDayAfterEnd > currentDate) {
        logInfo("Timeframe has not matured yet", {
          endUtc: timeframeResult.end_utc,
          currentDate: currentDate.toISOString(),
          requiresMaturityUntil: oneDayAfterEnd.toISOString(),
        });
        await this.storeFeedback(
          tx,
          prediction.id,
          "timeframe_extraction",
          `Prediction timeframe ends on ${timeframeResult.end_utc}. Predictions must be mature for at least one day before verification. Can be verified after ${oneDayAfterEnd.toISOString()}.`,
          "FUTURE_TIMEFRAME",
        );
        return true;
      }
    }

    const validationResult = await this.validateFilterExtraction(
      targetText,
      timeframeText,
      target,
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
      targetText,
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

  async runVerifier(stopHook: () => boolean): Promise<void> {
    const workers = Array.from({ length: this.config.concurrency }, (_, i) =>
      this.runWorker(i + 1, stopHook),
    );

    await Promise.all(workers);
  }
}
