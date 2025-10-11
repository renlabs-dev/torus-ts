import { z } from "zod";

// =============================================================================
// BASE PARAMETER SCHEMAS
// =============================================================================

export const timeWindowParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const paginationParamsSchema = z.object({
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});

export const agentParamsSchema = z.object({
  agent_address: z.string().min(1).optional(),
});

// =============================================================================
// COMBINED PARAMETER SCHEMAS
// =============================================================================

export const agentContributionStatsParamsSchema = timeWindowParamsSchema.extend(
  agentParamsSchema.shape,
);

export const contentListParamsSchema = timeWindowParamsSchema
  .extend(paginationParamsSchema.shape)
  .extend(agentParamsSchema.shape)
  .extend(
    z.object({
      search: z.string().optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    }).shape,
  );

export const permissionsListParamsSchema = agentParamsSchema;

// =============================================================================
// AGENT & CONTRIBUTION SCHEMAS
// =============================================================================

export const agentContributionStatsItemSchema = z.object({
  wallet_address: z.string(),
  num_predictions_submitted: z.number().int().min(0),
  num_verification_claims_submitted: z.number().int().min(0),
  num_verification_verdicts_submitted: z.number().int().min(0),
  num_tasks_claimed: z.number().int().min(0),
  num_tasks_completed: z.number().int().min(0),
  num_verification_claims_verified_by_other_agents: z.number().int().min(0),
});

export const agentContributionStatsResponseSchema = z.object({
  agent_contribution_stats: z.array(agentContributionStatsItemSchema),
});

// =============================================================================
// PREDICTION SCHEMAS
// =============================================================================

export const tweetSchema = z.object({
  author_twitter_user_id: z.string().nullable(),
  author_twitter_username: z.string(),
  conversation_id: z.string().nullable(),
  full_text: z.string(),
  id: z.number().int(),
  in_reply_to_tweet_id: z.string().nullable(),
  inserted_at: z.string().datetime(),
  inserted_by_address: z.string(),
  quoted_tweet_id: z.string().nullable(),
  raw_json: z.string(),
  retweeted_tweet_id: z.string().nullable(),
  tweet_id: z.string(),
  tweet_timestamp: z.string().datetime(),
  tweet_type: z.string(),
  url: z.string().url(),
});

export const predictionSchema = z.object({
  id: z.number().int(),
  inserted_at: z.string().datetime(),
  inserted_by_address: z.string(),
  predictor_twitter_username: z.string().optional(),
  predictor_twitter_user_id: z.string().nullable().optional(),
  prediction_timestamp: z.string().datetime().optional(),
  url: z.string().url().optional(),
  full_post: z.string().optional(),
  prediction: z.string(),
  topic: z.string(),
  context: z.any().nullable(),
  tweet: tweetSchema.nullable().optional(),
  verification_claims: z.array(z.any()),
  verification_verdict: z
    .object({
      reasoning: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export const predictionsResponseSchema = z.array(predictionSchema);

export const predictionsListParamsSchema = timeWindowParamsSchema
  .extend(paginationParamsSchema.shape)
  .extend(agentParamsSchema.shape)
  .extend(
    z.object({
      search: z.string().optional(),
      sort_by: z.enum(["id", "twitter_username"]).optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    }).shape,
  );

// =============================================================================
// PROPHET FINDER SCHEMAS
// =============================================================================

export const prophetProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  profile_image_url: z.string(),
  follower_count: z.number().int(),
  following_count: z.number().int(),
  profile_tweet_count: z.number().int(),
  scraped_tweet_count: z.number().int(),
  last_scraped: z.string().datetime().nullable(),
});

export const prophetProfilesResponseSchema = z.array(prophetProfileSchema);

export const prophetProfilesParamsSchema = paginationParamsSchema.extend({
  twitter_username: z.string().optional(),
});

// =============================================================================
// VERIFICATION SCHEMAS
// =============================================================================

export const verificationClaimSchema = z.object({
  id: z.number().int(),
  inserted_at: z.string().datetime(),
  inserted_by_address: z.string(),
  prediction_id: z.number().int(),
  outcome: z.string(),
  proof: z.string(),
});

export const verificationClaimsResponseSchema = z.array(
  verificationClaimSchema,
);

export const verificationVerdictSchema = z.object({
  id: z.number().int(),
  inserted_at: z.string().datetime(),
  inserted_by_address: z.string(),
  prediction_id: z.number().int(),
  verdict: z.string(),
  reasoning: z.string().optional(),
});

export const verificationVerdictsResponseSchema = z.array(
  verificationVerdictSchema,
);

// =============================================================================
// CONTENT & SCORING SCHEMAS
// =============================================================================

export const contentScoreSchema = z.object({
  id: z.string(),
  agent_address: z.string(),
  content_id: z.string(),
  content_type: z.enum(["prediction", "verification_claim", "verdict"]),
  score: z.number(),
  created_at: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const contentScoresResponseSchema = z.object({
  data: z.array(contentScoreSchema),
  success: z.boolean(),
  total: z.number().int().min(0).optional(),
});

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

export const permissionSchema = z.object({
  id: z.number().int().positive(),
  ss58_address: z.string(),
  permission: z.enum([
    "InsertPredictions",
    "InsertVerificationClaims",
    "InsertVerificationVerdicts",
    "InsertTasks",
  ]),
  created_at: z.string().datetime(),
});

export const permissionsResponseSchema = z.array(permissionSchema);

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const authChallengeRequestSchema = z.object({
  wallet_address: z.string().min(1, "Wallet address is required").optional(),
});

export const authChallengeResponseSchema = z.object({
  challenge_token: z.string().uuid(),
  message: z.string(),
  expires_at: z.string().datetime(),
});

export const authVerifyRequestSchema = z.object({
  challenge_token: z.string().uuid(),
  signature: z.string().min(1, "Signature is required"),
});

export const authVerifyResponseSchema = z.object({
  success: z.boolean().optional(),
  token: z.string().optional(),
  wallet_address: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  message: z.string().optional(),
});

export const authSessionSchema = z.object({
  token: z.string(),
  wallet_address: z.string(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  last_used_at: z.string().datetime().optional(),
});

export const authSessionsResponseSchema = z.object({
  sessions: z.array(authSessionSchema),
  total: z.number().int().min(0),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Parameter types
export type TimeWindowParams = z.infer<typeof timeWindowParamsSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type AgentParams = z.infer<typeof agentParamsSchema>;
export type AgentContributionStatsParams = z.infer<
  typeof agentContributionStatsParamsSchema
>;
export type ContentListParams = z.infer<typeof contentListParamsSchema>;
export type PermissionsListParams = z.infer<typeof permissionsListParamsSchema>;

// Agent & Contribution types
export type AgentContributionStatsItem = z.infer<
  typeof agentContributionStatsItemSchema
>;
export type AgentContributionStatsResponse = z.infer<
  typeof agentContributionStatsResponseSchema
>;

// Prediction types
export type Prediction = z.infer<typeof predictionSchema>;
export type PredictionsResponse = z.infer<typeof predictionsResponseSchema>;
export type PredictionsListParams = z.infer<typeof predictionsListParamsSchema>;

// Prophet Finder types
export type ProphetProfile = z.infer<typeof prophetProfileSchema>;
export type ProphetProfilesResponse = z.infer<typeof prophetProfilesResponseSchema>;
export type ProphetProfilesParams = z.infer<typeof prophetProfilesParamsSchema>;

// Verification types
export type VerificationClaim = z.infer<typeof verificationClaimSchema>;
export type VerificationClaimsResponse = z.infer<
  typeof verificationClaimsResponseSchema
>;
export type VerificationVerdict = z.infer<typeof verificationVerdictSchema>;
export type VerificationVerdictsResponse = z.infer<
  typeof verificationVerdictsResponseSchema
>;

// Content & Scoring types
export type ContentScore = z.infer<typeof contentScoreSchema>;
export type ContentScoresResponse = z.infer<typeof contentScoresResponseSchema>;

// Permission types
export type Permission = z.infer<typeof permissionSchema>;
export type PermissionsResponse = z.infer<typeof permissionsResponseSchema>;

// Auth types
export type AuthChallengeRequest = z.infer<typeof authChallengeRequestSchema>;
export type AuthChallengeResponse = z.infer<typeof authChallengeResponseSchema>;
export type AuthVerifyRequest = z.infer<typeof authVerifyRequestSchema>;
export type AuthVerifyResponse = z.infer<typeof authVerifyResponseSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthSessionsResponse = z.infer<typeof authSessionsResponseSchema>;
