import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
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
    description: varchar("description", { length: 280 }),
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
  (t) => [index("twitter_users_id_idx").on(t.id)],
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
    index("twitter_scraping_jobs_conversation_id_idx").on(t.conversationId),
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
    retweetedId: bigint("retweeted_id"), // The inner tweet (for retweets)

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
    index("scraped_tweet_author_id_idx").on(t.authorId),
    index("scraped_tweet_date_idx").on(t.date),
    index("scraped_tweet_conversation_id_idx").on(t.conversationId),
    index("scraped_tweet_prediction_id_idx").on(t.predictionId),
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
    context: jsonb("context"), // JsonB - whatever the filter agent thinks is relevant
    filterAgentId: ss58Address("filter_agent_id"),
    ...timeFields(),
  },
  (t) => [
    index("parsed_prediction_prediction_id_idx").on(t.predictionId),
    index("parsed_prediction_topic_id_idx").on(t.topicId),
    index("parsed_prediction_quality_idx").on(t.predictionQuality),
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
    predictionId: uuidv7("prediction_id")
      .notNull()
      .references(() => predictionSchema.id),
    conclusion: jsonb("conclusion").notNull().$type<VerdictConclusion[]>(), // Array of VerdictConclusion
    ...timeFields(),
  },
  (t) => [
    index("verdict_prediction_id_idx").on(t.predictionId),
    index("verdict_created_at_idx").on(t.createdAt),
  ],
);

/**
 * Verdict conclusion data
 */
export interface VerdictConclusion {
  parsedId: ParsedPredictionId;
  feedback: string;
}
