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

    username: varchar("username", { length: 30 }),
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
    scrapedAt: timestampz("scraped_at"),
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
    target: jsonb("target").$type<PostSlice[]>().notNull(),
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
    filterAgentSignature: text("filter_agent_signature"),
    agentAllegedTimestamp: timestampz("agent_alleged_timestamp"),
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

// ==== Verification Claims ====

/**
 * Source evidence for verification claims
 */
export interface ClaimSource {
  url: string;
  title?: string;
  snippet?: string;
  retrievedAt: string;
  archiveUrl?: string;
}

/**
 * Claims submitted by open verifiers asserting a prediction's outcome.
 * Each verifier can submit one claim per prediction.
 * The verdict system evaluates claims to produce final verdicts.
 */
export const verificationClaimSchema = createTable(
  "verification_claim",
  {
    id: uuidv7("id").primaryKey(),
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .notNull()
      .references(() => parsedPredictionSchema.id, { onDelete: "cascade" }),
    verifierAgentId: ss58Address("verifier_agent_id").notNull(),
    verifierAgentSignature: text("verifier_agent_signature").notNull(),
    claimOutcome: boolean("claim_outcome").notNull(),
    confidence: decimal("confidence").notNull(),
    reasoning: text("reasoning").notNull(),
    sources: jsonb("sources").$type<ClaimSource[]>(),
    timeframeStartUtc: timestampz("timeframe_start_utc"),
    timeframeEndUtc: timestampz("timeframe_end_utc"),
    timeframePrecision: varchar("timeframe_precision", { length: 32 }),
    ...timeFields(),
  },
  (t) => [
    unique("verification_claim_unique_verifier").on(
      t.parsedPredictionId,
      t.verifierAgentId,
    ),
    index("verification_claim_parsed_prediction_id_idx").on(
      t.parsedPredictionId,
    ),
    index("verification_claim_verifier_agent_id_idx").on(t.verifierAgentId),
    index("verification_claim_created_at_idx").on(t.createdAt),
  ],
);

/**
 * Tracks which topics a verifier has registered to verify.
 * Used for weighting claims from topic specialists.
 */
export const verifierTopicRegistrationSchema = createTable(
  "verifier_topic_registration",
  {
    id: uuidv7("id").primaryKey(),
    verifierAgentId: ss58Address("verifier_agent_id").notNull(),
    topicId: uuidv7("topic_id")
      .notNull()
      .references(() => predictionTopicSchema.id),
    ...timeFields(),
  },
  (t) => [
    unique("verifier_topic_unique").on(t.verifierAgentId, t.topicId),
    index("verifier_topic_agent_idx").on(t.verifierAgentId),
    index("verifier_topic_topic_idx").on(t.topicId),
  ],
);

// ==== Verdicts ====

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
    acceptedClaimId: uuidv7("accepted_claim_id").references(
      () => verificationClaimSchema.id,
    ),
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
  /** The tier of the source that corroborated the claim (3=major news, 2=trade pub, 1=specialty, 0=unknown) */
  sourceTier?: number;
  /** The URL of the corroborating source */
  corroboratingSource?: string;
}

// ==== Duplicate Relations ====

/**
 * Stores duplicate relationships between parsed predictions.
 * Uses additive/append-only pattern to support concurrent deduplication.
 */
export const predictionDuplicateRelationsSchema = createTable(
  "prediction_duplicate_relations",
  {
    predictionId: uuidv7("prediction_id")
      .notNull()
      .references(() => parsedPredictionSchema.id, {
        onDelete: "cascade",
      }),
    canonicalId: uuidv7("canonical_id")
      .notNull()
      .references(() => parsedPredictionSchema.id, {
        onDelete: "cascade",
      }),
    similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }),
    ...timeFields(),
  },
  (t) => [
    primaryKey({ columns: [t.predictionId, t.canonicalId] }),
    index("prediction_duplicate_relations_prediction_id_idx").on(
      t.predictionId,
    ),
    index("prediction_duplicate_relations_canonical_id_idx").on(t.canonicalId),
  ],
);

/**
 * Tracks which conversations have been processed for deduplication.
 * Prevents redundant reprocessing of already-deduplicated conversations.
 */
export const deduplicationProcessedConversationsSchema = createTable(
  "deduplication_processed_conversations",
  {
    conversationId: bigint("conversation_id").primaryKey(),
    predictionsProcessed: integer("predictions_processed").notNull(),
    duplicatesFound: integer("duplicates_found").notNull(),
    ...timeFields(),
  },
);

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
  "VAGUE_TARGET",
  "PRESENT_STATE",
  "SELF_ANNOUNCEMENT",
  "PERSONAL_ACTION",
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
 * @deprecated Use claimValidationFeedbackSchema for claim-level feedback
 * Stores feedback for predictions that failed validation (legacy)
 */
export const parsedPredictionFeedbackSchema = createTable(
  "parsed_prediction_feedback",
  {
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .primaryKey()
      .references(() => parsedPredictionSchema.id, {
        onDelete: "cascade",
      }),
    validationStep: varchar("validation_step", { length: 64 }).notNull(),
    failureCause: failureCauseEnum("failure_cause"),
    reason: text("reason").notNull(),
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

/**
 * Claim validation result enum
 */
export const claimValidationResultEnum = pgEnum("claim_validation_result", [
  "rejected", // Trusted source contradicted the claim (verifier bug)
  "no_corroboration", // Sources fetched but none supported the claim
  "no_sources", // Claim had no valid source URLs
  "fetch_failed", // All sources failed to fetch (temporary, retry later)
]);

export const claimValidationResultValues = extract_pgenum_values(
  claimValidationResultEnum,
);
export type ClaimValidationResult = keyof typeof claimValidationResultValues;

/**
 * Stores per-claim feedback from the judge's validation process.
 * One row per claim. Soft-deleted when claim results in successful verdict.
 *
 * Query logic:
 * - No row OR deletedAt set = claim not yet evaluated or succeeded
 * - Row exists with deletedAt null = claim failed validation
 * - fetch_failed results are eligible for retry after 1 hour (check updatedAt)
 */
export const claimValidationFeedbackSchema = createTable(
  "claim_validation_feedback",
  {
    claimId: uuidv7("claim_id")
      .primaryKey()
      .references(() => verificationClaimSchema.id, { onDelete: "cascade" }),
    result: claimValidationResultEnum("result").notNull(),
    reason: text("reason").notNull(),
    ...timeFields(),
  },
  (t) => [
    index("claim_validation_feedback_result_idx").on(t.result),
    index("claim_validation_feedback_updated_at_idx").on(t.updatedAt),
    index("claim_validation_feedback_active_idx")
      .on(t.claimId)
      .where(sql`deleted_at IS NULL`),
  ],
);

/**
 * Stores per-verifier feedback on predictions.
 * When a verifier submits feedback, that prediction is excluded from their claimable list.
 */
export const verifierFeedbackSchema = createTable(
  "verifier_feedback",
  {
    id: uuidv7("id").primaryKey(),
    parsedPredictionId: uuidv7("parsed_prediction_id")
      .notNull()
      .references(() => parsedPredictionSchema.id, { onDelete: "cascade" }),
    verifierAgentId: ss58Address("verifier_agent_id").notNull(),
    verifierAgentSignature: text("verifier_agent_signature").notNull(),
    failureCause: failureCauseEnum("failure_cause").notNull(),
    reason: text("reason").notNull(),
    ...timeFields(),
  },
  (t) => [
    unique("verifier_feedback_unique").on(
      t.parsedPredictionId,
      t.verifierAgentId,
    ),
    index("verifier_feedback_prediction_idx").on(t.parsedPredictionId),
    index("verifier_feedback_agent_idx").on(t.verifierAgentId),
    index("verifier_feedback_failure_cause_idx").on(t.failureCause),
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

export const reportType = pgEnum("report_type", [
  "INACCURACY",
  "FEEDBACK",
  "OTHER",
]);

export const predictionReport = createTable(
  "prediction_report",
  {
    id: uuidv7("id").primaryKey(),

    userKey: ss58Address("user_key").notNull(),
    parsedPredictionId: uuidv7("parsed_prediction_id").references(
      () => parsedPredictionSchema.id,
      {
        onDelete: "cascade",
      },
    ),

    reportType: reportType("report_type").notNull(),
    content: text("content"),

    ...timeFields(),
  },
  (t) => [
    index("prediction_report_parsed_prediction_id_idx").on(
      t.parsedPredictionId,
    ),
    index("prediction_report_user_key_idx").on(t.userKey),
    index("prediction_report_report_type_idx").on(t.reportType),
  ],
);

// ==== User Watches ====

/**
 * Tracks which users (by wallet address) are watching which Twitter users.
 * Used to create personalized feeds of predictions from watched predictors.
 */
export const userWatchesSchema = createTable(
  "user_watches",
  {
    id: uuidv7("id").primaryKey(),
    watcherKey: ss58Address("watcher_key").notNull(),
    watchedUserId: bigint("watched_user_id")
      .notNull()
      .references(() => twitterUsersSchema.id),
    ...timeFields(),
  },
  (t) => [
    unique("user_watches_unique").on(t.watcherKey, t.watchedUserId),
    index("user_watches_watcher_key_idx").on(t.watcherKey),
    index("user_watches_watched_user_id_idx").on(t.watchedUserId),
  ],
);

/**
 * Tracks which tweets (predictions) users have starred/bookmarked.
 * Used to create personalized feeds of starred predictions.
 */
export const userStarsSchema = createTable(
  "user_stars",
  {
    id: uuidv7("id").primaryKey(),
    userKey: ss58Address("user_key").notNull(),
    tweetId: bigint("tweet_id")
      .notNull()
      .references(() => scrapedTweetSchema.id),
    ...timeFields(),
  },
  (t) => [
    unique("user_stars_unique").on(t.userKey, t.tweetId),
    index("user_stars_user_key_idx").on(t.userKey),
    index("user_stars_tweet_id_idx").on(t.tweetId),
  ],
);

// ==== Scraped Sources Cache ====

/**
 * Caches web page scrapes from Firecrawl to avoid redundant API calls.
 * Shared across workers and persists across restarts.
 */
export const scrapedSourcesSchema = createTable(
  "scraped_sources",
  {
    normalizedUrl: varchar("normalized_url", { length: 2048 }).primaryKey(),
    originalUrl: varchar("original_url", { length: 2048 }).notNull(),
    success: boolean("success").notNull(),

    // Success fields (null if success=false)
    content: text("content"),
    title: varchar("title", { length: 512 }),
    description: text("description"),

    // Error fields (null if success=true)
    error: text("error"),
    statusCode: integer("status_code"), // HTTP status code for smarter cache invalidation

    ...timeFields(),
  },
  (t) => [
    index("scraped_sources_created_at_idx").on(t.createdAt),
    index("scraped_sources_success_idx").on(t.success),
  ],
);

// ==== Contributor Reward System ====

/**
 * Track reward distributions with scores and recipients
 */
export const rewardDistributionsSchema = createTable(
  "reward_distributions",
  {
    id: uuidv7("id").primaryKey(),
    distributionTime: timestampz("distribution_time").notNull(),
    permissionId: varchar("permission_id", { length: 66 }),
    scores: jsonb("scores").$type<Record<string, number>>().notNull(), // filter_agent_id (SS58Address) -> weight
    ...timeFields(),
  },
  (t) => [
    index("reward_distributions_distribution_time_idx").on(t.distributionTime),
    index("reward_distributions_permission_id_idx").on(t.permissionId),
  ],
);
