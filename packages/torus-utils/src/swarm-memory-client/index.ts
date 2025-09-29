// Main client export
export { SwarmMemoryClient as SwarmMemory } from "./swarm-client.js";

// Base client for advanced usage
export {
  BaseSwarmMemoryApiClient,
  type SwarmMemoryClientConfig,
} from "./client.js";

// Authentication exports
export { SwarmAuth } from "./auth/swarm-auth.js";
export { type Signer, KeypairSigner, InjectorSigner } from "./auth/signers.js";

// Endpoint classes (for advanced usage)
export { TasksEndpoint } from "./endpoints/tasks.js";
export { TweetsEndpoint } from "./endpoints/tweets.js";

// Error exports
export {
  SwarmMemoryError,
  SwarmAuthenticationError,
  SwarmNetworkError,
  SwarmValidationError,
  SwarmRateLimitError,
} from "./utils/errors.js";

// Constants exports
export {
  SWARM_API_BASE_URL,
  SWARM_ENDPOINTS,
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_SWARM_CONFIG,
} from "./utils/constants.js";

// Type exports - Common schemas
export type {
  AgentAddress,
  PaginationParams,
  PaginationResponse,
  RFC3339DateTime,
  SwarmApiResponse,
} from "./schemas/common.js";

// Schema exports (for validation and advanced usage)
export {
  AgentAddressSchema,
  PaginationParamsSchema,
  PaginationResponseSchema,
  RFC3339DateTimeSchema,
  SwarmApiResponseSchema,
} from "./schemas/common.js";

// Type exports - Task schemas
export type {
  ListTasksResponse,
  Task,
  TaskStatus,
  TaskType,
} from "./schemas/task.js";
export {
  ListTasksResponseSchema,
  TaskSchema,
  TaskStatusSchema,
  TaskTypeSchema,
} from "./schemas/task.js";

// Type exports - Tweet schemas
export type {
  APITweet, // Legacy compatibility
  BatchInsertResult,
  InsertTweetParams,
  InsertTweetResponse,
  ListTweetsParams,
  ListTweetsResponse,
  SwarmTweet,
  TweetIdItem,
  TweetIdsResponse,
} from "./schemas/tweet.js";
export {
  APITweetSchema, // Legacy compatibility
  BatchInsertResultSchema,
  InsertTweetParamsSchema,
  InsertTweetResponseSchema,
  ListTweetsParamsSchema,
  ListTweetsResponseSchema,
  SwarmTweetSchema,
  TweetIdItemSchema,
  TweetIdsResponseSchema,
} from "./schemas/tweet.js";
