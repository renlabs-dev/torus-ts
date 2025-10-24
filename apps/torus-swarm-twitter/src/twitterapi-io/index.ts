// Main client export

// Base client (for advanced usage)
export { KaitoTwitterAPIClient } from "./client.js";
export { ActionsEndpoint } from "./endpoints/actions.js";
export { TweetsEndpoint } from "./endpoints/tweets.js";
// Endpoint classes (for advanced usage)
export { UsersEndpoint } from "./endpoints/users.js";
export { KaitoTwitterAPI, KaitoTwitterAPI as default } from "./kaito-client.js";
// Action types
export type {
  ActionResponse,
  Community,
  CreateCommunityV2Params,
  CreateTweetResponse,
  CreateTweetV2Params,
  DeleteCommunityV2Params,
  DeleteTweetV2Params,
  DirectMessage,
  DMHistory,
  FollowUserV2Params,
  GetDMHistoryParams,
  JoinCommunityV2Params,
  LeaveCommunityV2Params,
  LikeTweetV2Params,
  LoginV2Params,
  LoginV2Response,
  RetweetTweetV2Params,
  SendDMV2Params,
  UnfollowUserV2Params,
  UnlikeTweetV2Params,
  UploadMediaResponse,
  UploadMediaV2Params,
} from "./schemas/action.js";
// Common schemas and types
export type {
  CursorPagination,
  Entities,
  Media,
  ProfileBio,
  UrlEntity,
} from "./schemas/common.js";

// Tweet types
export type {
  AdvancedSearchParams,
  Article,
  GetArticleParams,
  GetTweetQuotesParams,
  GetTweetRepliesParams,
  GetTweetRetweetersParams,
  GetTweetsByIdsParams,
  GetTweetThreadContextParams,
  Retweeter,
  SearchResult,
  SimpleTweet,
  ThreadContext,
  Tweet,
  TweetEntities,
  TweetMedia,
} from "./schemas/tweet.js";
// User types
export type {
  BatchGetUserInfoParams,
  CheckFollowRelationshipParams,
  FollowRelationship,
  GetUserConnectionsParams,
  GetUserInfoParams,
  GetUserLastTweetsParams,
  GetUserMentionsParams,
  GetVerifiedFollowersParams,
  SearchUserParams,
  SimpleUser,
  User,
} from "./schemas/user.js";
// Types
export type {
  KaitoApiResponse,
  KaitoClientConfig,
  PaginationParams,
  PaginationResponse,
} from "./types.js";

// Constants (for advanced usage)
export { API_BASE_URL, ENDPOINTS } from "./utils/constants.js";
// Error classes
export {
  KaitoAuthenticationError,
  KaitoRateLimitError,
  KaitoTwitterAPIError,
  KaitoValidationError,
} from "./utils/errors.js";
