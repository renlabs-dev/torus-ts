export { BaseAPIClient, type BaseClientConfig } from "./base-client.js";
export {
  BaseAPIError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  handleRequestError,
  handleHttpError,
} from "./errors.js";
export {
  ApiKeyAuth,
  BearerTokenAuth,
  type AuthStrategy,
  type TokenProvider,
} from "./auth/index.js";
