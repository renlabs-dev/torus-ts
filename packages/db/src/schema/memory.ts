import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  text,
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
  uuidv7,
} from "./utils";

// ==== Tracked Users ====

/**
 * Tracks users being monitored for predictions
 */
export const trackedTwitterUsersSchema = createTable(
  "tracked_twitter_users",
  {
    userId: bigint("user_id").primaryKey(),
    lastKnownTweetCount: integer("last_known_tweet_count"),
    ...timeFields(),
  },
  (t) => [index("tracked_users_user_id_idx").on(t.userId)],
);

// ==== User Suggestions ====

/**
 * Stores wallet-based user suggestions
 */
export const twitterUserSuggestionsSchema = createTable(
  "twitter_user_suggestions",
  {
    userId: bigint("user_id").notNull(),
    wallet: ss58Address("wallet").notNull(),
    ...timeFields(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.wallet] })],
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
    goalPostId: varchar("goal_post_id", { length: 256 }).notNull(),
    goalStart: integer("goal_start").notNull(),
    goalEnd: integer("goal_end").notNull(),
    timeframePostId: varchar("timeframe_post_id", { length: 256 }).notNull(),
    timeframeStart: integer("timeframe_start").notNull(),
    timeframeEnd: integer("timeframe_end").notNull(),
    llmConfidence: integer("llm_confidence").notNull(), // Stored as basis points (0-1)
    confidence: integer("confidence"), // Stored as basis points (0-1)
    vagueness: integer("vagueness"), // Stored as basis points (0-1)
    topicId: uuidv7("topic_id").references(() => predictionTopicSchema.id),
    context: jsonb("context"), // JsonB - whatever the filter agent thinks is relevant
    filterAgentId: varchar("filter_agent_id", { length: 256 }),
    ...timeFields(),
  },
  (t) => [
    index("parsed_prediction_prediction_id_idx").on(t.predictionId),
    index("parsed_prediction_topic_id_idx").on(t.topicId),
  ],
);

/**
 * Main predictions table
 */
export const predictionSchema = createTable(
  "prediction",
  {
    id: uuidv7("id").primaryKey(),
    parsedId: uuidv7("parsed_id")
      .notNull()
      .references((): AnyPgColumn => parsedPredictionSchema.id),
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
 * Post slice reference
 */
export interface PostSlice {
  post_id: string;
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
    parentId: uuidv7("parent_id").references(
      (): AnyPgColumn => predictionTopicSchema.id,
    ),
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
