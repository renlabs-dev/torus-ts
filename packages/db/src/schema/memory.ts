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
export const twitterUsersSchema = createTable(
  "twitter_users",
  {
    userId: bigint("user_id").primaryKey(),

    username: varchar("username", { length: 15 }),
    screen_name: varchar("screen_name", { length: 50 }),
    description: varchar("description", { length: 280 }),
    avatar_url: varchar("avatar_url", { length: 280 }),
    is_verified: boolean("is_verified"),
    verified_type: varchar("verified_type", { length: 32 }),
    is_automated: boolean("is_automated"),
    automated_by: bigint("automated_by"),
    unavailable: boolean("unavailable"),
    unavailable_reason: varchar("description", { length: 280 }),
    user_created_at: timestampz("user_created_at"),

    tweet_count: integer("tweet_count"),
    follower_count: integer("follower_count"),
    following_count: integer("following_count"),

    tracked: boolean("tracked").notNull(),

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
    text: varchar("text", { length: 280 }).notNull(),
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
    goal: jsonb("goal").$type<PostSlice[]>().notNull(),
    timeframe: jsonb("timeframe").$type<PostSlice[]>().notNull(),
    llmConfidence: decimal("llm_confidence").notNull(), // Stored as basis points (0-1)
    vagueness: decimal("vagueness"), // Stored as basis points (0-1)
    topicId: uuidv7("topic_id").references(() => predictionTopicSchema.id),
    context: jsonb("context"), // JsonB - whatever the filter agent thinks is relevant
    filterAgentId: ss58Address("filter_agent_id"),
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
    source: jsonb("source").notNull().$type<PredictionSource>(),
    version: integer("version").notNull().default(1), // e.g., "1.0"
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
