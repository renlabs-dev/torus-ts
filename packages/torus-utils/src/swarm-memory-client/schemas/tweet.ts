import { z } from "zod";
import {
  AgentAddressSchema,
  PaginationParamsSchema,
  RFC3339DateTimeSchema,
} from "./common.js";

/**
 * Schema for tweet insertion (API input)
 */
export const InsertTweetParamsSchema = z.object({
  tweet_id: z.string(),
  author_twitter_username: z.string(),
  full_text: z.string(),
  tweet_timestamp: RFC3339DateTimeSchema,
  url: z.string(),
  tweet_type: z.string(),
  raw_json: z.string(),
  // Optional extended fields
  author_twitter_user_id: z.string().optional(),
  conversation_id: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  retweet_count: z.number().optional(),
  like_count: z.number().optional(),
  reply_count: z.number().optional(),
  quote_count: z.number().optional(),
  bookmark_count: z.number().optional(),
  view_count: z.number().optional(),
});

/**
 * Schema for stored tweet (database/API response)
 * Based on actual SwarmMemory API response structure
 */
export const SwarmTweetSchema = z.object({
  // Core fields (always present)
  id: z.number(),
  tweet_id: z.string(),
  author_twitter_username: z.string(),
  full_text: z.string(),
  tweet_timestamp: RFC3339DateTimeSchema,
  tweet_type: z.string(),
  url: z.string(),
  raw_json: z.string(),
  inserted_at: RFC3339DateTimeSchema,
  inserted_by_address: AgentAddressSchema,

  // Nullable fields (can be null in API response)
  author_twitter_user_id: z.string().nullable(),
  conversation_id: z.string().nullable(),
  in_reply_to_tweet_id: z.string().nullable(),
  retweeted_tweet_id: z.string().nullable(),
  quoted_tweet_id: z.string().nullable(),

  // Optional extended fields (may not be present)
  hashtags: z.array(z.string()).nullable().optional(),
  mentions: z.array(z.string()).nullable().optional(),
  retweet_count: z.number().nullable().optional(),
  like_count: z.number().nullable().optional(),
  reply_count: z.number().nullable().optional(),
  quote_count: z.number().nullable().optional(),
  bookmark_count: z.number().nullable().optional(),
  view_count: z.number().nullable().optional(),
});

/**
 * Schema for listing tweets parameters
 */
export const ListTweetsParamsSchema = PaginationParamsSchema.extend({
  // Tweet-specific filters (optional)
  tweet_type: z.string().optional(),
  author_user_id: z.string().optional(),
  conversation_id: z.string().optional(),
  hashtag: z.string().optional(),
  mention: z.string().optional(),
  min_likes: z.number().min(0).optional(),
  min_retweets: z.number().min(0).optional(),
});

/**
 * Schema for tweet list response
 */
export const ListTweetsResponseSchema = z.array(SwarmTweetSchema);

/**
 * Schema for single tweet insert response
 */
export const InsertTweetResponseSchema = SwarmTweetSchema;

/**
 * Schema for batch insert result
 */
export const BatchInsertResultSchema = z.object({
  results: z.array(SwarmTweetSchema),
  errorIds: z.array(z.string()),
  totalProcessed: z.number(),
  successCount: z.number(),
  errorCount: z.number(),
});

/**
 * Schema for tweet IDs response from /api/tweets/ids
 */
export const TweetIdItemSchema = z.object({
  id: z.number().describe("Internal database ID of the tweet row"),
  tweet_id: z
    .string()
    .describe("Twitter/X snowflake ID represented as a decimal string"),
});

export const TweetIdsResponseSchema = z.array(TweetIdItemSchema);

/**
 * Type definitions derived from schemas
 */
export type InsertTweetParams = z.infer<typeof InsertTweetParamsSchema>;
export type SwarmTweet = z.infer<typeof SwarmTweetSchema>;
export type ListTweetsParams = z.infer<typeof ListTweetsParamsSchema>;
export type ListTweetsResponse = z.infer<typeof ListTweetsResponseSchema>;
export type InsertTweetResponse = z.infer<typeof InsertTweetResponseSchema>;
export type BatchInsertResult = z.infer<typeof BatchInsertResultSchema>;
export type TweetIdItem = z.infer<typeof TweetIdItemSchema>;
export type TweetIdsResponse = z.infer<typeof TweetIdsResponseSchema>;

/**
 * Legacy compatibility - matches playground APITweet interface
 */
export const APITweetSchema = InsertTweetParamsSchema.omit({
  author_twitter_user_id: true,
  conversation_id: true,
  hashtags: true,
  mentions: true,
  retweet_count: true,
  like_count: true,
  reply_count: true,
  quote_count: true,
  bookmark_count: true,
  view_count: true,
});

export type APITweet = z.infer<typeof APITweetSchema>;
