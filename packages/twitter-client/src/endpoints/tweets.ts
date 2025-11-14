import { assert } from "tsafe";
import type { KaitoTwitterAPIClient } from "../client";
import type { CursorPagination } from "../schemas/common";
import {
  AdvancedSearchParamsSchema,
  AdvancedSearchResponseSchema,
  ArticleResponseSchema,
  GetArticleParamsSchema,
  GetTweetQuotesParamsSchema,
  GetTweetRepliesParamsSchema,
  GetTweetRetweetersParamsSchema,
  GetTweetsByIdsParamsSchema,
  GetTweetThreadContextParamsSchema,
  ThreadContextResponseSchema,
  TweetQuotesResponseSchema,
  TweetRepliesResponseSchema,
  TweetRetweetersResponseSchema,
  TweetsResponseSchema,
} from "../schemas/tweet";
import type {
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
  TweetListEntry,
} from "../schemas/tweet";
import { ENDPOINTS } from "../utils/constants";

export class TweetsEndpoint {
  constructor(readonly client: KaitoTwitterAPIClient) {}

  /**
   * Get tweets by tweet IDs
   */
  async getByIds(params: GetTweetsByIdsParams): Promise<TweetListEntry[]> {
    const validatedParams = GetTweetsByIdsParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.GET_TWEETS,
      { tweet_ids: validatedParams.tweetIds.join(",") },
      TweetsResponseSchema,
    );

    return response.tweets;
  }

  /**
   * Get tweet replies by tweet ID
   * Each page returns up to 20 replies (sometimes less due to filtering)
   * Order by reply time desc
   */
  async getReplies(
    params: GetTweetRepliesParams,
  ): Promise<CursorPagination<SimpleTweet>> {
    const validatedParams = GetTweetRepliesParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.TWEET_REPLIES,
      validatedParams,
      TweetRepliesResponseSchema,
    );

    // Use shared transformer for cursor pagination
    return toCursorPagination(response.tweets);
  }

  /**
   * Get tweet quotes by tweet ID
   * Each page returns exactly 20 quotes
   * Order by quote time desc
   */
  async getQuotes(
    params: GetTweetQuotesParams,
  ): Promise<CursorPagination<SimpleTweet>> {
    const validatedParams = GetTweetQuotesParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.TWEET_QUOTES,
      validatedParams,
      TweetQuotesResponseSchema,
    );

    // Use shared transformer for cursor pagination
    return toCursorPagination(response.tweets);
  }

  /**
   * Get tweet retweeters by tweet ID
   * Each page returns about 100 retweeters
   * Order by retweet time desc
   */
  async getRetweeters(
    params: GetTweetRetweetersParams,
  ): Promise<CursorPagination<Retweeter>> {
    const validatedParams = GetTweetRetweetersParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.TWEET_RETWEETERS,
      validatedParams,
      TweetRetweetersResponseSchema,
    );

    // Use shared transformer for cursor pagination with cursor info
    return toCursorPagination(
      response.users,
      response.next_cursor,
      response.has_next_page,
    );
  }

  /**
   * Get the thread context of a tweet
   * Returns the conversation thread that the tweet belongs to
   */
  async getThreadContext(
    params: GetTweetThreadContextParams,
  ): Promise<ThreadContext> {
    const validatedParams = GetTweetThreadContextParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.TWEET_THREAD_CONTEXT,
      validatedParams,
      ThreadContextResponseSchema,
    );

    // Transform the API response to match expected ThreadContext structure
    return {
      thread_tweets: response.tweets,
      conversation_id:
        response.tweets.length > 0
          ? response.tweets[0]?.conversationId || params.tweetId
          : params.tweetId,
      root_tweet: response.tweets.length > 0 ? response.tweets[0] : undefined,
    };
  }

  /**
   * Get article by tweet ID
   * Cost: 100 credits per article
   */
  async getArticle(params: GetArticleParams): Promise<Article> {
    const validatedParams = GetArticleParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.GET_ARTICLE,
      validatedParams,
      ArticleResponseSchema,
    );

    return this.client.validateApiResponse(
      response,
      ArticleResponseSchema.shape.data,
    );
  }

  /**
   * Advanced search for tweets
   * Each page returns up to 20 tweets (sometimes less due to filtering)
   */
  async advancedSearch(params: AdvancedSearchParams): Promise<SearchResult> {
    const validatedParams = AdvancedSearchParamsSchema.parse(params);

    const response = await this.client.get(
      ENDPOINTS.TWEET_ADVANCED_SEARCH,
      validatedParams,
      AdvancedSearchResponseSchema,
    );

    // Transform the direct response to match SearchResult structure
    return {
      tweets: response.tweets,
      has_next_page: response.has_next_page,
      cursor:
        response.has_next_page && response.next_cursor
          ? response.next_cursor
          : undefined,
      users: undefined, // Advanced search doesn't return users
    };
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
