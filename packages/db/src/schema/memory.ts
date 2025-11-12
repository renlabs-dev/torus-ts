import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { extract_pgenum_values } from "../utils";
import type { Context } from "./context-schemas";
import {
  bigint,
  createTable,
  ss58Address,
  timeFields,
  timestampz,
  uuidv7,
} from "./utils";

// ==== Tracked Users ====

/**
 * Tracks users being monitored for predictions
 */
export const twitterUsersSchema = createTable(
  "twitter_users",
  {
    id: bigint("id").primaryKey(),

    username: varchar("username", { length: 15 }),
    screenName: varchar("screen_name", { length: 50 }),
    description: text("description"),
    avatarUrl: varchar("avatar_url", { length: 280 }),
    isVerified: boolean("is_verified"),
    verifiedType: varchar("verified_type", { length: 32 }),
    isAutomated: boolean("is_automated"),
    automatedBy: varchar("automated_by", { length: 15 }),
    unavailable: boolean("unavailable"),
    unavailableReason: varchar("unavailable_reason", { length: 280 }),
    userCreatedAt: timestampz("user_created_at"),

    tweetCount: integer("tweet_count"),
    followerCount: integer("follower_count"),
    followingCount: integer("following_count"),

    oldestTrackedTweet: bigint("oldest_tracked_tweet"),
    newestTrackedTweet: bigint("newest_tracked_tweet"),
    tracked: boolean("tracked").notNull(),

    ...timeFields(),
  },
  (t) => [
    index("twitter_users_id_idx").using("hash", t.id),
    index("twitter_users_tracked_idx").using("hash", t.tracked),
    index("twitter_users_username_idx").using(
      "btree",
      sql`lower(${t.username})`,
    ),
  ],
);

// ==== User Suggestions ====

/**
 * Stores wallet-based user suggestions
 */
export const twitterUserSuggestionsSchema = createTable(
  "twitter_user_suggestions",
  {
    username: varchar("username", { length: 15 }).notNull(),
    wallet: ss58Address("wallet").notNull(),
    ...timeFields(),
  },
  (t) => [primaryKey({ columns: [t.username, t.wallet] })],
);

export const twitterScrapingJobsSchema = createTable(
  "twitter_scraping_jobs",
  {
    userId: bigint("user_id"),
    query: varchar("query", { length: 128 }),

    conversationId: bigint("conversation_id"),
    originalReplyId: bigint("original_reply_id"),
    nextReplyId: bigint("next_reply_id"),

    ...timeFields(),
  },
  (t) => [
    index("twitter_scraping_jobs_conversation_id_idx").using(
      "hash",
      t.conversationId,
    ),
    unique("twitter_scraping_jobs_user_id_idx").on(t.userId),
    unique("twitter_scraping_jobs_original_reply_id_idx").on(
      t.conversationId,
      t.originalReplyId,
    ),
  ],
);

// ==== Scraped Tweets ====

export type ScrapedTweet = typeof scrapedTweetSchema.$inferInsert;

/**
 * Stores scraped tweet data and metadata
 */
export const scrapedTweetSchema = createTable(
  "scraped_tweet",
  {
    id: bigint("id").primaryKey(), // Tweet ID from the platform
    text: varchar("text", { length: 25_000 }).notNull(),
    authorId: bigint("author_id").notNull(),
    date: timestampz("date").notNull(),
    quotedId: bigint("quoted_id"), // The inner tweet (for retweets)

    conversationId: bigint("conversation_id"), // Thread identifier
    parentTweetId: bigint("parent_tweet_id"), // The parent comment

    predictionId: uuidv7("prediction_id")
      .references((): AnyPgColumn => predictionSchema.id, {
        onDelete: "set null",
      })
      .default(sql`NULL`),

    ...timeFields(),
  },
  (t) => [
    index("scraped_tweet_author_id_idx").using("hash", t.authorId),
    index("scraped_tweet_date_idx").on(t.date),
    index("scraped_tweet_conversation_id_idx").on(t.conversationId),
    index("scraped_tweet_prediction_id_idx").on(t.predictionId),
    index("scraped_tweet_author_id_prediction_id_idx").using(
      "btree",
      t.predictionId.nullsLast(),
      t.authorId,
    ),
  ],
);

// ==== Predictions ====

/**
 * Custom type for parsed prediction ID
 */
export type ParsedPredictionId = string;

/**
 * Parsed predictions table - stores individual parsed predictions
 */
export const parsedPredictionSchema = createTable(
  "parsed_prediction",
  {
    id: uuidv7("id").primaryKey(),
    predictionId: uuidv7("prediction_id")
      .notNull()
      .references((): AnyPgColumn => predictionSchema.id, {
        onDelete: "cascade",
      }),
    goal: jsonb("goal").$type<PostSlice[]>().notNull(),
    timeframe: jsonb("timeframe").$type<PostSlice[]>().notNull(),
    topicId: uuidv7("topic_id")
      .notNull()
      .references(() => predictionTopicSchema.id),
    predictionQuality: integer("prediction_quality").notNull(), // 0-100 overall quality score
    briefRationale: text("brief_rationale").notNull(), // Max 300 words explaining quality
    llmConfidence: decimal("llm_confidence").notNull(), // Stored as basis points (0-1)
    vagueness: decimal("vagueness"), // Stored as basis points (0-1)
    context: jsonb("context").$type<Context>(), // Discriminated union of context schemas
    filterAgentId: ss58Address("filter_agent_id"),
    ...timeFields(),
  },
  (t) => [
    index("parsed_prediction_prediction_id_idx").using("hash", t.predictionId),
    index("parsed_prediction_topic_id_idx").on(t.topicId),
    index("parsed_prediction_quality_idx").on(t.predictionQuality),
  ],
);

/**
 * Stores extracted/parsed details from verification process.
 * All fields nullable except parsedPredictionId to support incremental population.
 */
export const parsedPredictionDetailsSchema = createTable(
  "parsed_prediction_details",
  {
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .primaryKey()
      .references(() => parsedPredictionSchema.id, {
        onDelete: "cascade",
      }),

    // Thread summary explaining what the prediction is about
    predictionContext: text("prediction_context"),

    timeframeStatus: varchar("timeframe_status", { length: 32 }), // "explicit", "implicit", "inferred", "event_trigger", "missing"
    timeframeStartUtc: timestampz("timeframe_start_utc"), // Parsed start time
    timeframeEndUtc: timestampz("timeframe_end_utc"), // Parsed end time
    timeframePrecision: varchar("timeframe_precision", { length: 32 }), // "hour", "day", "week", "month", "quarter", "year", "unbounded", "event"
    timeframeReasoning: text("timeframe_reasoning"), // Why this timeframe was extracted
    timeframeAssumptions: jsonb("timeframe_assumptions").$type<string[]>(), // Assumptions made during extraction
    timeframeConfidence: decimal("timeframe_confidence"), // 0.0 to 1.0

    filterValidationConfidence: decimal("filter_validation_confidence"), // 0.0 to 1.0
    filterValidationReasoning: text("filter_validation_reasoning"), // Why the filter validation passed/failed

    verdictConfidence: decimal("verdict_confidence"), // 0.0 to 1.0 confidence in verdict determination
    verdictSources: jsonb("verdict_sources").$type<
      {
        url: string;
        title?: string;
        content?: string;
      }[]
    >(), // URL citations from web search

    ...timeFields(),
  },
  (t) => [
    index("parsed_prediction_details_timeframe_start_utc_idx").on(
      t.timeframeStartUtc,
    ),
    index("parsed_prediction_details_timeframe_end_utc_idx").on(
      t.timeframeEndUtc,
    ),
    index("parsed_prediction_details_timeframe_status_idx").on(
      t.timeframeStatus,
    ),
  ],
);

/**
 * Main predictions table
 */
export const predictionSchema = createTable(
  "prediction",
  {
    id: uuidv7("id").primaryKey(),
    version: integer("version").notNull().default(1),
    ...timeFields(),
  },
  (t) => [index("prediction_created_at_idx").on(t.createdAt)],
);

/**
 * Source information for predictions
 */
export interface PredictionSource {
  tweet_id: string;
}

/**
 * Post slice reference
 */
export interface PostSlice {
  source: PredictionSource;
  start: number;
  end: number;
}

// ==== Prediction Topics ====

/**
 * Topics for categorizing predictions
 */
export const predictionTopicSchema = createTable(
  "prediction_topic",
  {
    id: uuidv7("id").primaryKey(),
    parentId: uuidv7("parent_id")
      .references((): AnyPgColumn => predictionTopicSchema.id)
      .default(sql`NULL`),
    name: text("name").notNull(),
    contextSchema: jsonb("context_schema"), // The JSONB schema needed
    ...timeFields(),
  },
  (t) => [
    index("prediction_topic_parent_id_idx").on(t.parentId),
    index("prediction_topic_name_idx").on(t.name),
  ],
);

// ==== Verdicts ====

// TODO: I don't think the JSON for the conclusion works
// Some of our queries are more complicated than this allows
// We shall see

/**
 * Stores verdicts for predictions
 */
export const verdictSchema = createTable(
  "verdict",
  {
    id: uuidv7("id").primaryKey(),
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .notNull()
      .references(() => parsedPredictionSchema.id),
    verdict: boolean("verdict").notNull(), // True if prediction came true, false otherwise
    context: jsonb("context").notNull().$type<VerdictContext>(), // Context explaining the verdict
    ...timeFields(),
  },
  (t) => [
    index("verdict_parsed_prediction_id_idx").using(
      "hash",
      t.parsedPredictionId,
    ),
    index("verdict_created_at_idx").on(t.createdAt),
    index("verdict_verdict_idx").on(t.verdict),
  ],
);

/**
 * Verdict context data
 */
export interface VerdictContext {
  feedback: string;
}

// ==== Prediction Feedback ====

export const failureCauseEnum = pgEnum("failure_cause_enum", [
  "NEGATION",
  "SARCASM",
  "CONDITIONAL",
  "QUOTING_OTHERS",
  "HEAVY_HEDGING",
  "FUTURE_TIMEFRAME",
  "MISSING_TIMEFRAME",
  "BROKEN_EXTRACTION",
  "VAGUE_GOAL",
  "PRESENT_STATE",
  "OTHER",
  "EVENT_TRIGGER",
  "EMPTY_SLICES",
  "MISSING_TWEET",
  "NEGATIVE_INDICES",
  "INVALID_RANGE",
  "SLICE_TOO_SHORT",
  "OUT_OF_BOUNDS",
]);

export const failureCauseValues = extract_pgenum_values(failureCauseEnum);
export type FailureCause = keyof typeof failureCauseValues;

/**
 * Stores feedback for predictions that failed validation
 */
export const parsedPredictionFeedbackSchema = createTable(
  "parsed_prediction_feedback",
  {
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .primaryKey()
      .references(() => parsedPredictionSchema.id, {
        onDelete: "cascade",
      }),
    validationStep: varchar("validation_step", { length: 64 }).notNull(), // Which step failed: "slice_validation", "timeframe_extraction", "filter_validation", "verdict_validation"
    failureCause: failureCauseEnum("failure_cause"), // Structured failure reason (for filter_validation and verdict_validation)
    reason: text("reason").notNull(), // Human-readable explanation of why it failed validation
    ...timeFields(),
  },
  (t) => [
    index("parsed_prediction_feedback_parsed_prediction_id_idx").on(
      t.parsedPredictionId,
    ),
    index("parsed_prediction_feedback_validation_step_idx").on(
      t.validationStep,
    ),
    index("parsed_prediction_feedback_failure_cause_idx").on(t.failureCause),
    index("parsed_prediction_feedback_future_timeframe_idx")
      .on(t.parsedPredictionId)
      .where(sql`failure_cause != 'FUTURE_TIMEFRAME'`),
  ],
);

// ==== Credit System ====

/**
 * User credit balances for paid services (e.g., Twitter scraping).
 *
 * Credits can be purchased with TORUS tokens and spent on various services.
 * Uses row-level locking (SELECT FOR UPDATE) to prevent race conditions.
 */
export const userCreditsSchema = createTable("user_credits", {
  userKey: ss58Address("user_key").primaryKey(),
  balance: decimal("balance", { precision: 39, scale: 0 })
    .notNull()
    .default("0"),
  totalPurchased: decimal("total_purchased", { precision: 39, scale: 0 })
    .notNull()
    .default("0"),
  totalSpent: decimal("total_spent", { precision: 39, scale: 0 })
    .notNull()
    .default("0"),
  ...timeFields(),
});

/**
 * Credit purchase transactions via TORUS token transfers.
 *
 * Each transaction hash can only be used once (enforced by unique constraint).
 * Backend verifies transactions on-chain before granting credits.
 *
 * TORUS amounts stored as bigint (18 decimals): 1 TORUS = 10^18
 */
export const creditPurchasesSchema = createTable(
  "credit_purchases",
  {
    id: uuidv7("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    txHash: varchar("tx_hash", { length: 66 }).notNull().unique(),
    torusAmount: decimal("torus_amount", { precision: 39, scale: 0 }),
    creditsGranted: decimal("credits_granted", { precision: 39, scale: 0 }),
    blockNumber: bigint("block_number"),
    ...timeFields(),
  },
  (t) => [index("credit_purchases_user_key_idx").on(t.userKey)],
);
