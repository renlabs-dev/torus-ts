import { z } from "zod";
import {
  MediaSchema,
  ProxyConfigSchema,
  TweetIdSchema,
  UserIdSchema,
  UsernameSchema,
} from "./common.js";

// Login V2 request schema
export const LoginV2ParamsSchema = z.object({
  user_name: UsernameSchema,
  email: z.string().email(),
  password: z.string().min(1),
  totp_secret: z.string().optional(),
  proxy: ProxyConfigSchema,
});

// Login V2 response schema
export const LoginV2ResponseSchema = z.object({
  login_cookie: z.string(),
  status: z.literal("success"),
  msg: z.string().optional(),
});

// Upload media V2 request schema
export const UploadMediaV2ParamsSchema = z.object({
  media: z.string(), // base64 encoded media or file path
  media_type: z.enum(["image", "video", "gif"]),
  login_cookie: z.string(),
});

// Create tweet V2 request schema
export const CreateTweetV2ParamsSchema = z.object({
  text: z.string().max(280),
  media_ids: z.array(z.string()).optional(),
  reply_to: TweetIdSchema.optional(),
  quote_tweet_id: TweetIdSchema.optional(),
  login_cookie: z.string(),
});

// Delete tweet V2 request schema
export const DeleteTweetV2ParamsSchema = z.object({
  tweet_id: TweetIdSchema,
  login_cookie: z.string(),
});

// Retweet tweet V2 request schema
export const RetweetTweetV2ParamsSchema = z.object({
  tweet_id: TweetIdSchema,
  login_cookie: z.string(),
});

// Like tweet V2 request schema
export const LikeTweetV2ParamsSchema = z.object({
  tweet_id: TweetIdSchema,
  login_cookie: z.string(),
});

// Unlike tweet V2 request schema
export const UnlikeTweetV2ParamsSchema = z.object({
  tweet_id: TweetIdSchema,
  login_cookie: z.string(),
});

// Follow user V2 request schema
export const FollowUserV2ParamsSchema = z
  .object({
    user_name: UsernameSchema.optional(),
    user_id: UserIdSchema.optional(),
    login_cookie: z.string(),
  })
  .refine((data) => data.user_name || data.user_id, {
    message: "Either user_name or user_id must be provided",
  });

// Unfollow user V2 request schema
export const UnfollowUserV2ParamsSchema = z
  .object({
    user_name: UsernameSchema.optional(),
    user_id: UserIdSchema.optional(),
    login_cookie: z.string(),
  })
  .refine((data) => data.user_name || data.user_id, {
    message: "Either user_name or user_id must be provided",
  });

// Get DM history request schema
export const GetDMHistoryParamsSchema = z.object({
  user_id: UserIdSchema,
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(20),
  login_cookie: z.string(),
});

// Send DM V2 request schema
export const SendDMV2ParamsSchema = z.object({
  user_id: UserIdSchema,
  text: z.string().max(10000),
  media_id: z.string().optional(),
  login_cookie: z.string(),
});

// Create community V2 request schema
export const CreateCommunityV2ParamsSchema = z.object({
  name: z.string().min(1).max(25),
  description: z.string().max(160).optional(),
  is_private: z.boolean().optional().default(false),
  login_cookie: z.string(),
});

// Delete community V2 request schema
export const DeleteCommunityV2ParamsSchema = z.object({
  community_id: z.string(),
  login_cookie: z.string(),
});

// Join community V2 request schema
export const JoinCommunityV2ParamsSchema = z.object({
  community_id: z.string(),
  login_cookie: z.string(),
});

// Leave community V2 request schema
export const LeaveCommunityV2ParamsSchema = z.object({
  community_id: z.string(),
  login_cookie: z.string(),
});

// Direct message schema
export const DirectMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  sender_id: UserIdSchema,
  recipient_id: UserIdSchema,
  media: MediaSchema.optional(),
  reply_to: z.string().optional(),
});

// DM history response schema
export const DMHistorySchema = z.object({
  messages: z.array(DirectMessageSchema),
  cursor: z.string().optional(),
  has_more: z.boolean().optional(),
});

// Community schema
export const CommunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_private: z.boolean(),
  member_count: z.number().min(0),
  created_at: z.string(),
  admin_id: UserIdSchema,
});

// Generic action response schema
export const ActionResponseSchema = z.object({
  status: z.literal("success"),
  msg: z.string().optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

// Tweet creation response schema
export const CreateTweetResponseSchema = z.object({
  status: z.literal("success"),
  tweet_id: TweetIdSchema,
  msg: z.string().optional(),
});

// Media upload response schema
export const UploadMediaResponseSchema = z.object({
  status: z.literal("success"),
  media_id: z.string(),
  media_url: z.string().url(),
  msg: z.string().optional(),
});

// API Response schemas - these are used directly without the wrapper since they already include status
export const LoginV2ApiResponseSchema = z.object({
  status: z.literal("success"),
  data: LoginV2ResponseSchema,
  msg: z.string().optional(),
});

export const CreateTweetV2ApiResponseSchema = z.object({
  status: z.literal("success"),
  data: CreateTweetResponseSchema,
  msg: z.string().optional(),
});

export const UploadMediaV2ApiResponseSchema = z.object({
  status: z.literal("success"),
  data: UploadMediaResponseSchema,
  msg: z.string().optional(),
});

export const ActionApiResponseSchema = z.object({
  status: z.literal("success"),
  data: ActionResponseSchema,
  msg: z.string().optional(),
});

export const DMHistoryApiResponseSchema = z.object({
  status: z.literal("success"),
  data: DMHistorySchema,
  msg: z.string().optional(),
});

export const CommunityApiResponseSchema = z.object({
  status: z.literal("success"),
  data: CommunitySchema,
  msg: z.string().optional(),
});

// Type exports
export type LoginV2Params = z.infer<typeof LoginV2ParamsSchema>;
export type LoginV2Response = z.infer<typeof LoginV2ResponseSchema>;
export type UploadMediaV2Params = z.infer<typeof UploadMediaV2ParamsSchema>;
export type CreateTweetV2Params = z.infer<typeof CreateTweetV2ParamsSchema>;
export type DeleteTweetV2Params = z.infer<typeof DeleteTweetV2ParamsSchema>;
export type RetweetTweetV2Params = z.infer<typeof RetweetTweetV2ParamsSchema>;
export type LikeTweetV2Params = z.infer<typeof LikeTweetV2ParamsSchema>;
export type UnlikeTweetV2Params = z.infer<typeof UnlikeTweetV2ParamsSchema>;
export type FollowUserV2Params = z.infer<typeof FollowUserV2ParamsSchema>;
export type UnfollowUserV2Params = z.infer<typeof UnfollowUserV2ParamsSchema>;
export type GetDMHistoryParams = z.infer<typeof GetDMHistoryParamsSchema>;
export type SendDMV2Params = z.infer<typeof SendDMV2ParamsSchema>;
export type CreateCommunityV2Params = z.infer<
  typeof CreateCommunityV2ParamsSchema
>;
export type DeleteCommunityV2Params = z.infer<
  typeof DeleteCommunityV2ParamsSchema
>;
export type JoinCommunityV2Params = z.infer<typeof JoinCommunityV2ParamsSchema>;
export type LeaveCommunityV2Params = z.infer<
  typeof LeaveCommunityV2ParamsSchema
>;
export type DirectMessage = z.infer<typeof DirectMessageSchema>;
export type DMHistory = z.infer<typeof DMHistorySchema>;
export type Community = z.infer<typeof CommunitySchema>;
export type ActionResponse = z.infer<typeof ActionResponseSchema>;
export type CreateTweetResponse = z.infer<typeof CreateTweetResponseSchema>;
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;
