import { z } from "zod";
import {
  ApiResponseSchema,
  CursorPaginationSchema,
  TwitterDateSchema,
  UserIdSchema,
  UsernameSchema,
} from "./common.js";

// Available user schema - when the user is accessible
export const AvailableUserSchema = z.object({
  // Core identification
  id: UserIdSchema,
  userName: z.string(),
  name: z.string(),
  url: z.union([z.string().url(), z.literal("")]).optional(),

  // Profile information
  description: z.string().optional(),
  location: z.string().optional(),
  profilePicture: z.string().url(),
  coverPicture: z.string().url().nullable().optional(),

  // Verification status
  isVerified: z.boolean().optional(),
  isBlueVerified: z.boolean(),
  verifiedType: z.string().nullable().optional(),

  // Privacy and protection
  protected: z.boolean().optional(),
  canDm: z.boolean(),

  // Stats
  followers: z.number().min(0),
  following: z.number().min(0),
  favouritesCount: z.number().min(0),
  statusesCount: z.number().min(0),
  mediaCount: z.number().min(0),

  // Timestamps
  createdAt: TwitterDateSchema,

  // Optional fields that may not be present
  hasCustomTimelines: z.boolean().optional(),
  isTranslator: z.boolean().optional(),
  withheldInCountries: z.array(z.string()).optional(),
  possiblySensitive: z.boolean().optional(),

  // Automation
  isAutomated: z.boolean(),
  automatedBy: z.string().nullable().optional(),

  // Additional data
  pinnedTweetIds: z.array(z.string()),
  affiliatesHighlightedLabel: z.record(z.string(), z.unknown()).optional(),
  entities: z.record(z.string(), z.unknown()).optional(),

  // Discriminator (always false for available users)
  unavailable: z.literal(false).optional(),
});

// Unavailable user schema - when the user is suspended/unavailable
export const UnavailableUserSchema = z.object({
  unavailable: z.literal(true),
  message: z.string(),
  unavailableReason: z.string(),
});

// Discriminated union for user data
export const UserSchema = z.discriminatedUnion("unavailable", [
  AvailableUserSchema,
  UnavailableUserSchema,
]);

// Simplified user schema for lists/followers
export const SimpleUserSchema = z.object({
  id: UserIdSchema,
  userName: z.string(),
  name: z.string(),
  profilePicture: z.string().url(),
  isBlueVerified: z.boolean().optional(),
  verifiedType: z.string().nullable().optional(),
  followers: z.number().min(0).optional(),
  following: z.number().min(0).optional(),
});

// User info request parameters
export const GetUserInfoParamsSchema = z.object({
  userName: UsernameSchema,
});

// Batch user info request parameters
export const BatchGetUserInfoParamsSchema = z.object({
  userIds: z.array(UserIdSchema).min(1).max(100),
});

// User followers/following parameters
export const GetUserConnectionsParamsSchema = z.object({
  userName: UsernameSchema,
  cursor: z.string().optional(),
});

// User last tweets parameters - matches actual twitterapi.io API
export const GetUserLastTweetsParamsSchema = z.object({
  userId: z.string().optional(), // user id (recommended, more stable than userName)
  userName: UsernameSchema.optional(), // screen name (userId and userName are mutually exclusive)
  cursor: z.string().optional(),
  includeReplies: z.boolean().optional(), // Whether to include replies
  // Note: API always returns up to 20 tweets per page, no limit parameter exists
});

// User mentions parameters
export const GetUserMentionsParamsSchema = z.object({
  userName: UsernameSchema,
  cursor: z.string().optional(),
});

// User search parameters
export const SearchUserParamsSchema = z.object({
  keyword: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(20).optional(),
});

// Check follow relationship parameters
export const CheckFollowRelationshipParamsSchema = z.object({
  sourceUserName: UsernameSchema,
  targetUserName: UsernameSchema,
});

// Follow relationship response
export const FollowRelationshipSchema = z.object({
  following: z.boolean(),
  followed_by: z.boolean(),
  can_dm: z.boolean().optional(),
  blocking: z.boolean().optional(),
  blocked_by: z.boolean().optional(),
  muting: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
});

// Get verified followers parameters
export const GetVerifiedFollowersParamsSchema = z.object({
  userName: UsernameSchema,
  cursor: z.string().optional(),
});

// API Response schemas
export const UserInfoSuccessResponseSchema = z.object({
  status: z.literal("success"),
  data: UserSchema,
  msg: z.string().optional(),
});

// API Response schemas
export const UserInfoFailureResponseSchema = z.object({
  status: z.literal("error"),
  msg: z.string().optional(),
});

// Discriminated union for user data
export const UserInfoResponseSchema = z.discriminatedUnion("status", [
  UserInfoSuccessResponseSchema,
  UserInfoFailureResponseSchema,
]);

export const BatchUserInfoResponseSchema = z.object({
  status: z.literal("success"),
  users: z.array(UserSchema),
  msg: z.string().optional(),
});

// Follower schema - matches the API response format with different field names
export const FollowerSchema = z
  .object({
    id: UserIdSchema,
    name: z.string(),
    screen_name: z.string(), // API uses screen_name instead of userName
    userName: z.string(), // Also present in response
    location: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    description: z.string().optional(),
    email: z.string().nullable().optional(),
    protected: z.boolean(),
    verified: z.boolean().optional(),
    followers_count: z.number().min(0),
    following_count: z.number().min(0),
    friends_count: z.number().min(0),
    favourites_count: z.number().min(0),
    statuses_count: z.number().min(0),
    media_tweets_count: z.number().min(0),
    created_at: z.string(),
    profile_banner_url: z.string().nullable().optional(),
    profile_image_url_https: z.string(),
    can_dm: z.boolean(),
  })
  .transform((data) => {
    // Transform to match SimpleUserSchema interface
    return {
      id: data.id,
      userName: data.userName || data.screen_name,
      name: data.name,
      profilePicture: data.profile_image_url_https,
      isBlueVerified: data.verified,
      verifiedType: null,
      followers: data.followers_count,
      following: data.following_count,
    };
  });

export const UserFollowersResponseSchema = z.object({
  followers: z.array(FollowerSchema),
  has_next_page: z.boolean(),
  next_cursor: z.string().optional(),
  status: z.literal("success"),
  msg: z.string().optional(),
  code: z.number().optional(),
});

export const UserFollowingsResponseSchema = z.object({
  followings: z.array(FollowerSchema), // API uses "followings" not "following"
  has_next_page: z.boolean(),
  next_cursor: z.string().optional(),
  status: z.literal("success"),
  msg: z.string().optional(),
  code: z.number().optional(),
});

// Backwards compatibility
export const UserConnectionsResponseSchema = UserFollowersResponseSchema;

export const UserLastTweetsDataSchema = z.object({
  pin_tweet: z.unknown().nullable(),
  tweets: z.array(z.unknown()), // We'll just pass through the tweets as unknown to avoid circular import
});

export const UserLastTweetsResponseSchema = z.object({
  status: z.literal("success"),
  code: z.number(),
  msg: z.string(),
  data: UserLastTweetsDataSchema,
});

export const UserSearchResponseSchema = ApiResponseSchema(
  CursorPaginationSchema(SimpleUserSchema),
);

export const FollowRelationshipResponseSchema = z.object({
  status: z.literal("success"),
  data: FollowRelationshipSchema,
  msg: z.string().optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type SimpleUser = z.infer<typeof SimpleUserSchema>;
export type GetUserInfoParams = z.infer<typeof GetUserInfoParamsSchema>;
export type BatchGetUserInfoParams = z.infer<
  typeof BatchGetUserInfoParamsSchema
>;
export type GetUserConnectionsParams = z.infer<
  typeof GetUserConnectionsParamsSchema
>;
export type GetUserLastTweetsParams = z.infer<
  typeof GetUserLastTweetsParamsSchema
>;
export type GetUserMentionsParams = z.infer<typeof GetUserMentionsParamsSchema>;
export type SearchUserParams = z.infer<typeof SearchUserParamsSchema>;
export type CheckFollowRelationshipParams = z.infer<
  typeof CheckFollowRelationshipParamsSchema
>;
export type FollowRelationship = z.infer<typeof FollowRelationshipSchema>;
export type GetVerifiedFollowersParams = z.infer<
  typeof GetVerifiedFollowersParamsSchema
>;
