/* eslint-disable @typescript-eslint/ban-ts-comment */

import { assert } from "tsafe";
import type { KaitoTwitterAPIClient } from "../client.js";
import type { CursorPagination } from "../schemas/common.js";
import type { SimpleTweet } from "../schemas/tweet.js";
import { TweetRepliesResponseSchema } from "../schemas/tweet.js";
import {
  BatchGetUserInfoParamsSchema,
  BatchUserInfoResponseSchema,
  CheckFollowRelationshipParamsSchema,
  FollowRelationshipResponseSchema,
  GetUserConnectionsParamsSchema,
  GetUserInfoParamsSchema,
  GetUserLastTweetsParamsSchema,
  GetUserMentionsParamsSchema,
  GetVerifiedFollowersParamsSchema,
  SearchUserParamsSchema,
  UserConnectionsResponseSchema,
  UserFollowingsResponseSchema,
  UserInfoResponseSchema,
  UserLastTweetsResponseSchema,
  UserSearchResponseSchema,
} from "../schemas/user.js";
import type {
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
} from "../schemas/user.js";
import { ENDPOINTS } from "../utils/constants.js";

export class UsersEndpoint {
  constructor(readonly client: KaitoTwitterAPIClient) {}

  /**
   * Get user info by screen name
   */
  async getInfo(params: GetUserInfoParams): Promise<User | undefined> {
    const validatedParams = GetUserInfoParamsSchema.parse(params);

    try {
      const response = await this.client.get(
        ENDPOINTS.USER_INFO,
        validatedParams,
        UserInfoResponseSchema,
      );
      return response.status === "success" ? response.data : undefined;
    } catch (e) {
      if (String(e).includes("user not found")) {
        return undefined;
      } else {
        throw e;
      }
    }
  }

  /**
   * Batch get user info by user IDs
   * Pricing: 18 credits per single user, 10 credits per user for bulk requests (100+ users)
   */
  async batchGetInfo(params: BatchGetUserInfoParams): Promise<User[]> {
    const validatedParams = BatchGetUserInfoParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_BATCH_INFO,
      { userIds: validatedParams.userIds.join(",") },
      BatchUserInfoResponseSchema,
    );

    return response.users;
  }

  /**
   * Get user's last tweets
   * Each page returns up to 20 tweets
   */
  async getLastTweets(
    params: GetUserLastTweetsParams,
  ): Promise<CursorPagination<SimpleTweet>> {
    const validatedParams = GetUserLastTweetsParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_LAST_TWEETS,
      validatedParams,
      UserLastTweetsResponseSchema,
    );

    // Use shared transformer for cursor pagination
    return toCursorPagination(response.data.tweets as SimpleTweet[]);
  }

  /**
   * Get user followers in reverse chronological order
   * Returns exactly 200 followers per page
   */
  async getFollowers(
    params: GetUserConnectionsParams,
  ): Promise<CursorPagination<SimpleUser>> {
    const validatedParams = GetUserConnectionsParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_FOLLOWERS,
      validatedParams,
      // TODO: @steinerkelvin
      // @ts-ignore
      UserConnectionsResponseSchema,
    );

    // Use shared transformer for cursor pagination with cursor info
    return toCursorPagination(
      response.followers,
      response.next_cursor,
      response.has_next_page,
    );
  }

  /**
   * Get user followings
   * Each page returns exactly 200 followings
   */
  async getFollowings(
    params: GetUserConnectionsParams,
  ): Promise<CursorPagination<SimpleUser>> {
    const validatedParams = GetUserConnectionsParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_FOLLOWINGS,
      validatedParams,
      // TODO: @steinerkelvin
      // @ts-ignore
      UserFollowingsResponseSchema,
    );

    // Use shared transformer for cursor pagination with cursor info
    return toCursorPagination(
      response.followings,
      response.next_cursor,
      response.has_next_page,
    );
  }

  /**
   * Get user mentions
   * Each page returns exactly 20 mentions
   */
  async getMentions(
    params: GetUserMentionsParams,
  ): Promise<CursorPagination<SimpleTweet>> {
    const validatedParams = GetUserMentionsParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_MENTIONS,
      validatedParams,
      TweetRepliesResponseSchema,
    );

    // Use shared transformer for cursor pagination
    return toCursorPagination(response.tweets);
  }

  /**
   * Search users by keyword
   */
  async search(
    params: SearchUserParams,
  ): Promise<CursorPagination<SimpleUser>> {
    const validatedParams = SearchUserParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_SEARCH,
      validatedParams,
      UserSearchResponseSchema,
    );

    // Response is validated and error responses are already thrown as errors
    // So at this point we know it's a success response
    assert(response.status !== "error");
    return response.data;
  }

  /**
   * Check follow relationship between two users
   * Price: 100 credits per call
   */
  async checkFollowRelationship(
    params: CheckFollowRelationshipParams,
  ): Promise<FollowRelationship> {
    const validatedParams = CheckFollowRelationshipParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.CHECK_FOLLOW_RELATIONSHIP,
      validatedParams,
      FollowRelationshipResponseSchema,
    );

    return response.data;
  }

  /**
   * Get user verified followers
   * Returns exactly 20 verified followers per page
   * Price: $0.3 per 1000 followers
   */
  async getVerifiedFollowers(
    params: GetVerifiedFollowersParams,
  ): Promise<CursorPagination<SimpleUser>> {
    const validatedParams = GetVerifiedFollowersParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.USER_VERIFIED_FOLLOWERS,
      validatedParams,
      // TODO: @steinerkelvin
      // @ts-ignore
      UserConnectionsResponseSchema,
    );

    // Transform the direct response to cursor pagination format
    // Use shared transformer for cursor pagination with cursor info
    return toCursorPagination(
      response.followers,
      response.next_cursor,
      response.has_next_page,
    );
  }
}

/**
 * Create a cursor pagination object from data and optional cursor info
 */
export function toCursorPagination<T>(
  data: T[],
  cursor?: string,
  hasMore?: boolean,
): CursorPagination<T> {
  // If hasMore is true, cursor must be provided
  assert(!hasMore || cursor !== undefined);

  return {
    data,
    cursor,
    hasMore: hasMore ?? false,
  };
}
