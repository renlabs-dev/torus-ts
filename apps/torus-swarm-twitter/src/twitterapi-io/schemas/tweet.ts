import { z } from "zod";
import {
  TweetIdSchema,
  TwitterDateSchema,
  UrlEntitySchema,
  UserIdSchema,
} from "./common.js";
import { SimpleUserSchema } from "./user.js";

// Tweet media schema
export const TweetMediaSchema = z.object({
  id: z.string(),
  type: z.enum(["photo", "video", "animated_gif"]),
  url: z.string().url(),
  preview_image_url: z.string().url().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(), // for videos
});

// Tweet entities schema
export const TweetEntitiesSchema = z.object({
  hashtags: z
    .array(
      z.object({
        text: z.string(),
        indices: z.array(z.number()),
      }),
    )
    .optional(),
  urls: z.array(UrlEntitySchema).optional(),
  user_mentions: z
    .array(
      z.object({
        id: UserIdSchema,
        screen_name: z.string(),
        name: z.string(),
        indices: z.array(z.number()),
      }),
    )
    .optional(),
  media: z.array(TweetMediaSchema).optional(),
});

// Base tweet schema
export const TweetSchema = z.object({
  id: TweetIdSchema,
  text: z.string(),
  created_at: TwitterDateSchema,
  author_id: UserIdSchema,
  author: SimpleUserSchema.optional(),
  public_metrics: z
    .object({
      retweet_count: z.number().min(0),
      like_count: z.number().min(0),
      reply_count: z.number().min(0),
      quote_count: z.number().min(0),
      bookmark_count: z.number().min(0).optional(),
      impression_count: z.number().min(0).optional(),
    })
    .optional(),
  entities: TweetEntitiesSchema.optional(),
  referenced_tweets: z
    .array(
      z.object({
        type: z.enum(["replied_to", "quoted", "retweeted"]),
        id: TweetIdSchema,
      }),
    )
    .optional(),
  in_reply_to_user_id: UserIdSchema.optional(),
  conversation_id: TweetIdSchema.optional(),
  reply_settings: z
    .enum(["everyone", "mentioned_users", "followers"])
    .optional(),
  lang: z.string().optional(),
  possibly_sensitive: z.boolean().optional(),
  source: z.string().optional(),
  withheld: z
    .object({
      copyright: z.boolean().optional(),
      country_codes: z.array(z.string()).optional(),
    })
    .optional(),
});

export const EmptyTweetSchema = z.object({ id: z.literal("") });

// Simplified tweet schema for lists - matches actual API response
export const SimpleTweetSchema = z.object({
  id: TweetIdSchema,
  text: z.string(),

  // API uses camelCase for tweets but snake_case for some other endpoints
  createdAt: TwitterDateSchema.optional(),
  created_at: TwitterDateSchema.optional(),

  // Author info - API inconsistency
  author_id: UserIdSchema.optional(),
  author: SimpleUserSchema.optional(),

  // Reply-related fields (camelCase in API)
  inReplyToId: z.union([TweetIdSchema, z.literal(""), z.null()]).optional(),
  inReplyToUserId: z.union([UserIdSchema, z.literal(""), z.null()]).optional(),
  inReplyToUsername: z.string().nullable().optional(),
  isReply: z.boolean().optional(),
  conversationId: TweetIdSchema.optional(),

  // Metrics (API uses camelCase)
  retweetCount: z.number().min(0).optional(),
  likeCount: z.number().min(0).optional(),
  replyCount: z.number().min(0).optional(),
  quoteCount: z.number().min(0).optional(),
  // viewCount: z.number().min(0).optional(),
  bookmarkCount: z.number().min(0).optional(),

  // Legacy snake_case versions (for compatibility)
  retweet_count: z.number().min(0).optional(),
  like_count: z.number().min(0).optional(),
  reply_count: z.number().min(0).optional(),
  quote_count: z.number().min(0).optional(),
  view_count: z.number().min(0).optional(),
  bookmark_count: z.number().min(0).optional(),

  // Additional fields from API response
  url: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  source: z.string().optional(),
  lang: z.string().optional(),
  displayTextRange: z.array(z.number()).optional(),

  // Tweet type and context
  type: z.literal("tweet").optional(),

  // Extended entities and media
  extendedEntities: z.record(z.string(), z.unknown()).optional(),
  entities: z.record(z.string(), z.unknown()).optional(),
  card: z.unknown().nullable().optional(),
  place: z.record(z.string(), z.unknown()).optional(),

  // Quote/retweet related
  quoted_tweet: z
    .object({
      id: TweetIdSchema,
    })
    .nullable()
    .optional(),
  retweeted_tweet: z
    .object({
      id: TweetIdSchema,
    })
    .nullable()
    .optional(),

  // Additional flags
  isLimitedReply: z.boolean().optional(),
  article: z.unknown().nullable().optional(),
});

// Discriminated union for user data
export const TweetListEntrySchema = z.union([
  EmptyTweetSchema,
  SimpleTweetSchema,
]);

// Get tweets by IDs parameters
export const GetTweetsByIdsParamsSchema = z.object({
  tweetIds: z.array(TweetIdSchema).min(1).max(100),
});

// Get tweet replies parameters
export const GetTweetRepliesParamsSchema = z.object({
  tweetId: TweetIdSchema,
  cursor: z.string().optional(),
  // Note: API always returns up to 20 replies per page, no limit parameter exists
});

// Get tweet quotes parameters
export const GetTweetQuotesParamsSchema = z.object({
  tweetId: TweetIdSchema,
  cursor: z.string().optional(),
  // Note: API always returns up to 20 quotes per page, no limit parameter exists
});

// Get tweet retweeters parameters
export const GetTweetRetweetersParamsSchema = z.object({
  tweetId: TweetIdSchema,
  cursor: z.string().optional(),
  // Note: API always returns about 100 retweeters per page, no limit parameter exists
});

// Get tweet thread context parameters
export const GetTweetThreadContextParamsSchema = z.object({
  tweetId: TweetIdSchema,
});

// Get article parameters
export const GetArticleParamsSchema = z.object({
  tweetId: TweetIdSchema,
});

// Advanced search parameters - matches actual twitterapi.io API
export const AdvancedSearchParamsSchema = z.object({
  query: z.string().min(1),
  queryType: z.enum(["Latest", "Top"]).optional().default("Latest"), // Actual API parameter
  cursor: z.string().optional(),
  // Note: API always returns up to 20 results per page, no limit parameter exists
  // Note: result_type doesn't exist, use queryType instead
  // Additional parameters may exist but are not documented
});

// Thread context schema
export const ThreadContextSchema = z.object({
  thread_tweets: z.array(SimpleTweetSchema),
  conversation_id: TweetIdSchema,
  root_tweet: SimpleTweetSchema.optional(),
});

// Article schema
export const ArticleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  image_url: z.string().url().optional(),
  published_at: TwitterDateSchema.optional(),
  author: z.string().optional(),
  content: z.string().optional(),
});

// Retweeter schema - API returns user data directly
export const RetweeterSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  userName: z.string(),
  location: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  protected: z.boolean(),
  verified: z.boolean().optional(), // deprecated, use isBlueVerified
  followers: z.number().min(0),
  following: z.number().min(0),
  favouritesCount: z.number().min(0),
  statusesCount: z.number().min(0),
  mediaCount: z.number().min(0),
  createdAt: TwitterDateSchema,
  coverPicture: z.string().url().nullable(),
  profilePicture: z.string().url(),
  canDm: z.boolean(),
});

// Search result schema
export const SearchResultSchema = z.object({
  tweets: z.array(SimpleTweetSchema),
  users: z.array(SimpleUserSchema).optional(),
  has_next_page: z.boolean().optional(),
  cursor: z.string().optional(),
  total_count: z.number().optional(),
});

// API Response schemas
export const TweetsResponseSchema = z.object({
  tweets: z.array(TweetListEntrySchema),
});

// For pagination endpoints, the API returns {"tweets": [...]} not wrapped in success/error
export const TweetRepliesResponseSchema = z.object({
  tweets: z.array(SimpleTweetSchema),
});
export const TweetQuotesResponseSchema = z.object({
  tweets: z.array(SimpleTweetSchema),
});
export const TweetRetweetersResponseSchema = z.object({
  users: z.array(RetweeterSchema),
  has_next_page: z.boolean(),
  next_cursor: z.string().optional(),
});

export const ThreadContextResponseSchema = z.object({
  tweets: z.array(SimpleTweetSchema),
  has_next_page: z.boolean(),
  next_cursor: z.string().optional(),
  status: z.literal("success"),
  msg: z.string().optional(),
});

export const ArticleResponseSchema = z.object({
  status: z.literal("success"),
  data: ArticleSchema,
  msg: z.string().optional(),
});

export const AdvancedSearchResponseSchema = z.object({
  tweets: z.array(SimpleTweetSchema),
  has_next_page: z.boolean(),
  next_cursor: z.string().nullable().optional(), // Can be null, undefined, or string
});

// Type exports
export type Tweet = z.infer<typeof TweetSchema>;
export type SimpleTweet = z.infer<typeof SimpleTweetSchema>;
export type EmptyTweet = z.infer<typeof EmptyTweetSchema>;
export type TweetListEntry = z.infer<typeof TweetListEntrySchema>;
export type TweetMedia = z.infer<typeof TweetMediaSchema>;
export type TweetEntities = z.infer<typeof TweetEntitiesSchema>;
export type GetTweetsByIdsParams = z.infer<typeof GetTweetsByIdsParamsSchema>;
export type GetTweetRepliesParams = z.infer<typeof GetTweetRepliesParamsSchema>;
export type GetTweetQuotesParams = z.infer<typeof GetTweetQuotesParamsSchema>;
export type GetTweetRetweetersParams = z.infer<
  typeof GetTweetRetweetersParamsSchema
>;
export type GetTweetThreadContextParams = z.infer<
  typeof GetTweetThreadContextParamsSchema
>;
export type GetArticleParams = z.infer<typeof GetArticleParamsSchema>;
export type AdvancedSearchParams = z.infer<typeof AdvancedSearchParamsSchema>;
export type ThreadContext = z.infer<typeof ThreadContextSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Retweeter = z.infer<typeof RetweeterSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
