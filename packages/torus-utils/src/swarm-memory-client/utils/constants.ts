import type { Options as KyOptions } from "ky";

/**
 * SwarmMemory API base URL
 */
export const SWARM_API_BASE_URL = "https://memory.sension.torus.directory";

/**
 * SwarmMemory API endpoints
 */
export const SWARM_ENDPOINTS = {
  // Authentication
  AUTH_CHALLENGE: "api/auth/challenge",
  AUTH_VERIFY: "api/auth/verify",

  // Tweets
  TWEETS_LIST: "api/tweets/list",
  TWEETS_INSERT: "api/tweets/insert",

  // Predictions
  PREDICTIONS_LIST: "api/predictions/list",
  PREDICTIONS_INSERT: "api/predictions/insert",

  // Tasks
  TASKS_LIST: "api/tasks/list",
  TASKS_CREATE: "api/tasks/insert",

  // Verification Claims
  VERIFICATION_CLAIMS_LIST: "api/verification-claims/list",
  VERIFICATION_VERDICTS_LIST: "api/verification-verdicts/list",

  // Schemas
  SCHEMAS_LIST: "api/schemas/list",
  SCHEMAS_CREATE: "api/schemas/create",
} as const;

/**
 * Default timeout for SwarmMemory API requests (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default retry configuration for SwarmMemory API requests
 */
export const DEFAULT_RETRY_CONFIG: KyOptions["retry"] = {
  limit: 4,
  methods: ["get", "post", "put", "delete"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
  backoffLimit: 30000,
};

/**
 * Default SwarmMemory configuration
 */
export const DEFAULT_SWARM_CONFIG = {
  timeout: DEFAULT_TIMEOUT,
  retryConfig: DEFAULT_RETRY_CONFIG,
} as const;
