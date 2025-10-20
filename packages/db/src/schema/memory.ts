import {
  index,
  integer,
  jsonb,
  pgEnum,
  serial,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import { extract_pgenum_values } from "../utils";
import {
  bigint,
  createTable,
  ss58Address,
  timeFields,
  timestampz,
} from "./utils";

// ==== Tracked Users ====

/**
 * Tracks users being monitored for predictions
 */
export const trackedUsersSchema = createTable(
  "tracked_users",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id").notNull().unique(),
    lastScrapedAt: timestampz("last_scraped_at"),
    lastKnownTweetCount: integer("last_known_tweet_count"),
    ...timeFields(),
  },
  (t) => [index("tracked_users_user_id_idx").on(t.userId)],
);

// ==== User Suggestions ====

/**
 * Stores wallet-based user suggestions
 */
export const userSuggestionsSchema = createTable(
  "user_suggestions",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id").notNull(),
    wallet: ss58Address("wallet").notNull(),
    suggestedAt: timestampz("suggested_at"),
    ...timeFields(),
  },
  (t) => [
    unique().on(t.userId, t.wallet),
    index("user_suggestions_user_id_idx").on(t.userId),
    index("user_suggestions_wallet_idx").on(t.wallet),
  ],
);

// ==== Scraped Tweets ====

export const scrapingStatus = pgEnum("scraping_status", ["SCRAPING", "DONE"]);

export const scrapingStatusValues = extract_pgenum_values(scrapingStatus);

assert<Equals<keyof typeof scrapingStatusValues, "SCRAPING" | "DONE">>();

/**
 * Stores scraped tweet data and metadata
 */
export const scrapedTweetSchema = createTable(
  "scraped_tweet",
  {
    id: bigint("id").primaryKey(), // Tweet ID from the platform
    text: text("text").notNull(),
    authorId: bigint("author_id").notNull(),
    date: timestampz("date").notNull(),
    retweetedId: bigint("retweeted_id"), // The inner tweet (for retweets)

    conversationId: bigint("conversation_id"), // Thread identifier
    parentTweetId: bigint("parent_tweet_id"), // The parent comment

    scrapedAt: timestampz("scraped_at"),
    status: scrapingStatus("status").notNull(),
    ...timeFields(),
  },
  (t) => [
    index("scraped_tweet_author_id_idx").on(t.authorId),
    index("scraped_tweet_date_idx").on(t.date),
    index("scraped_tweet_conversation_id_idx").on(t.conversationId),
    index("scraped_tweet_status_idx").on(t.status),
  ],
);

// ==== Predictions ====

/**
 * Custom type for prediction ID
 */
export type PredictionId = string;

/**
 * Main predictions table
 */
export const predictionSchema = createTable(
  "prediction",
  {
    id: varchar("id", { length: 256 }).primaryKey().$type<PredictionId>(),
    parsed: jsonb("parsed").notNull().$type<ParsedPrediction[]>(), // Array of ParsedPrediction
    source: jsonb("source").notNull().$type<PredictionSource>(),
    version: text("version").notNull(), // e.g., "1.0"
    ...timeFields(),
  },
  (t) => [index("prediction_created_at_idx").on(t.createdAt)],
);

/**
 * Source information for predictions
 */
export interface PredictionSource {
  tweet_id: bigint;
}

/**
 * Parsed prediction data
 */
export interface ParsedPrediction {
  pred_id: PredictionId;
  parsed_id: ParsedPredictionId;
  goal: PostSlice;
  timeframe: PostSlice;
  llm_confidence: number;
  confidence?: number;
  vagueness?: number;
  topic?: PredictionTopicId;
  context?: unknown; // JsonB - whatever the filter agent thinks is relevant
  filter_agent_id?: string;
}

/**
 * Custom type for parsed prediction ID
 */
export type ParsedPredictionId = string;

/**
 * Post slice reference
 */
export interface PostSlice {
  post_id: string;
  start: number;
  end: number;
}

/**
 * Custom type for prediction topic ID
 */
export type PredictionTopicId = string;

// ==== Prediction Topics ====

/**
 * Topics for categorizing predictions
 */
export const predictionTopicSchema = createTable(
  "prediction_topic",
  {
    id: varchar("id", { length: 256 }).primaryKey().$type<PredictionTopicId>(),
    parentId: varchar("parent_id", { length: 256 }).$type<PredictionTopicId>(),
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

/**
 * Stores verdicts for predictions
 */
export const verdictSchema = createTable(
  "verdict",
  {
    id: serial("id").primaryKey(),
    predictionId: varchar("prediction_id", { length: 256 })
      .notNull()
      .$type<PredictionId>(),
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
  parsed_id: ParsedPredictionId;
  grok_is_true: boolean;
  feedback: string;
}
