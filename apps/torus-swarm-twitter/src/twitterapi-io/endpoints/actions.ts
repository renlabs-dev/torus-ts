import type { KaitoTwitterAPIClient } from "../client.js";
import {
  ActionApiResponseSchema,
  CommunityApiResponseSchema,
  CreateCommunityV2ParamsSchema,
  CreateTweetV2ApiResponseSchema,
  CreateTweetV2ParamsSchema,
  DeleteCommunityV2ParamsSchema,
  DeleteTweetV2ParamsSchema,
  DMHistoryApiResponseSchema,
  FollowUserV2ParamsSchema,
  GetDMHistoryParamsSchema,
  JoinCommunityV2ParamsSchema,
  LeaveCommunityV2ParamsSchema,
  LikeTweetV2ParamsSchema,
  LoginV2ApiResponseSchema,
  LoginV2ParamsSchema,
  RetweetTweetV2ParamsSchema,
  SendDMV2ParamsSchema,
  UnfollowUserV2ParamsSchema,
  UnlikeTweetV2ParamsSchema,
  UploadMediaV2ApiResponseSchema,
  UploadMediaV2ParamsSchema,
} from "../schemas/action.js";
import type {
  ActionResponse,
  Community,
  CreateCommunityV2Params,
  CreateTweetResponse,
  CreateTweetV2Params,
  DeleteCommunityV2Params,
  DeleteTweetV2Params,
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
} from "../schemas/action.js";
import { ENDPOINTS } from "../utils/constants.js";

export class ActionsEndpoint {
  constructor(private client: KaitoTwitterAPIClient) {}

  /**
   * Log in using email, username, password, and optional 2FA secret
   * Trial operation price: $0.003 per call
   */
  async login(params: LoginV2Params): Promise<LoginV2Response> {
    const validatedParams = LoginV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.USER_LOGIN_V2,
      validatedParams,
      LoginV2ApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Upload media to Twitter
   * Trial operation price: $0.003 per call
   */
  async uploadMedia(params: UploadMediaV2Params): Promise<UploadMediaResponse> {
    const validatedParams = UploadMediaV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.UPLOAD_MEDIA_V2,
      validatedParams,
      UploadMediaV2ApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Create a tweet
   * Trial operation price: $0.003 per call
   */
  async createTweet(params: CreateTweetV2Params): Promise<CreateTweetResponse> {
    const validatedParams = CreateTweetV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.CREATE_TWEET_V2,
      validatedParams,
      CreateTweetV2ApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Delete a tweet
   * Trial operation price: $0.002 per call
   */
  async deleteTweet(params: DeleteTweetV2Params): Promise<ActionResponse> {
    const validatedParams = DeleteTweetV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.DELETE_TWEET_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Retweet a tweet
   * Trial operation price: $0.002 per call
   */
  async retweetTweet(params: RetweetTweetV2Params): Promise<ActionResponse> {
    const validatedParams = RetweetTweetV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.RETWEET_TWEET_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Like a tweet
   * Trial operation price: $0.002 per call
   */
  async likeTweet(params: LikeTweetV2Params): Promise<ActionResponse> {
    const validatedParams = LikeTweetV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.LIKE_TWEET_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Unlike a tweet
   * Trial operation price: $0.002 per call
   */
  async unlikeTweet(params: UnlikeTweetV2Params): Promise<ActionResponse> {
    const validatedParams = UnlikeTweetV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.UNLIKE_TWEET_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Follow a user
   * Trial operation price: $0.002 per call
   */
  async followUser(params: FollowUserV2Params): Promise<ActionResponse> {
    const validatedParams = FollowUserV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.FOLLOW_USER_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Unfollow a user
   * Trial operation price: $0.002 per call
   */
  async unfollowUser(params: UnfollowUserV2Params): Promise<ActionResponse> {
    const validatedParams = UnfollowUserV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.UNFOLLOW_USER_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Get direct message history with a user
   */
  async getDMHistory(params: GetDMHistoryParams): Promise<DMHistory> {
    const validatedParams = GetDMHistoryParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.GET_DM_HISTORY,
      validatedParams,
      DMHistoryApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Send a direct message to a user
   * You can only send DMs to those who have allowed you to message them
   */
  async sendDM(params: SendDMV2Params): Promise<ActionResponse> {
    const validatedParams = SendDMV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.SEND_DM_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Create a community
   * Trial operation price: $0.003 per call
   */
  async createCommunity(params: CreateCommunityV2Params): Promise<Community> {
    const validatedParams = CreateCommunityV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.CREATE_COMMUNITY_V2,
      validatedParams,
      CommunityApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Delete a community
   * Trial operation price: $0.003 per call
   */
  async deleteCommunity(
    params: DeleteCommunityV2Params,
  ): Promise<ActionResponse> {
    const validatedParams = DeleteCommunityV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.DELETE_COMMUNITY_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Join a community
   * Trial operation price: $0.003 per call
   */
  async joinCommunity(params: JoinCommunityV2Params): Promise<ActionResponse> {
    const validatedParams = JoinCommunityV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.JOIN_COMMUNITY_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }

  /**
   * Leave a community
   * Trial operation price: $0.003 per call
   */
  async leaveCommunity(
    params: LeaveCommunityV2Params,
  ): Promise<ActionResponse> {
    const validatedParams = LeaveCommunityV2ParamsSchema.parse(params);

    const response = await this.client.post(
      ENDPOINTS.LEAVE_COMMUNITY_V2,
      validatedParams,
      ActionApiResponseSchema,
    );

    return response.data;
  }
}
