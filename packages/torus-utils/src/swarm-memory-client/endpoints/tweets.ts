import type { BaseSwarmMemoryApiClient } from "../client.js";
import {
  InsertTweetParamsSchema,
  InsertTweetResponseSchema,
  ListTweetsParamsSchema,
  ListTweetsResponseSchema,
  TweetIdsResponseSchema,
} from "../schemas/tweet.js";
import type {
  APITweet,
  BatchInsertResult,
  InsertTweetParams,
  ListTweetsParams,
  SwarmTweet,
  TweetIdsResponse,
} from "../schemas/tweet.js";
import { SWARM_ENDPOINTS } from "../utils/constants.js";

/**
 * Tweets endpoint for SwarmMemory API
 *
 * Provides methods to interact with tweet data in SwarmMemory:
 * - List tweets with filtering and pagination
 * - Insert single tweets
 * - Batch insert tweets with concurrency control
 *
 * @example
 * ```ts
 * const client = new SwarmMemory({ mnemonic: '...' });
 *
 * // List tweets
 * const tweets = await client.tweets.list({
 *   limit: 10,
 *   author_username: 'elonmusk'
 * });
 *
 * // Insert tweet
 * const tweet = await client.tweets.insert({
 *   tweet_id: '1234567890',
 *   author_twitter_username: 'elonmusk',
 *   full_text: 'Hello world!',
 *   tweet_timestamp: new Date().toISOString(),
 *   url: 'https://twitter.com/elonmusk/status/1234567890',
 *   tweet_type: 'original',
 *   raw_json: JSON.stringify({})
 * });
 * ```
 */
export class TweetsEndpoint {
  constructor(readonly client: BaseSwarmMemoryApiClient) {}

  /**
   * List tweets with optional filtering and pagination
   *
   * @param params - Optional filtering and pagination parameters
   * @returns Array of SwarmTweet objects
   */
  async list(params?: ListTweetsParams): Promise<SwarmTweet[]> {
    const validatedParams = params ? ListTweetsParamsSchema.parse(params) : {};

    return this.client.get(
      SWARM_ENDPOINTS.TWEETS_LIST,
      validatedParams,
      ListTweetsResponseSchema,
    );
  }

  /**
   * Insert a single tweet into SwarmMemory
   *
   * @param params - Tweet data to insert
   * @returns The inserted SwarmTweet object with database metadata
   */
  async insert(params: InsertTweetParams): Promise<SwarmTweet> {
    const validatedParams = InsertTweetParamsSchema.parse(params);

    return this.client.post(
      SWARM_ENDPOINTS.TWEETS_INSERT,
      validatedParams,
      InsertTweetResponseSchema,
    );
  }

  /**
   * Get tweet by database ID
   *
   * @param id - Database ID of the tweet
   * @returns SwarmTweet object
   */
  async getById(id: number): Promise<SwarmTweet> {
    return this.client.get(
      `${SWARM_ENDPOINTS.TWEETS_LIST}/${id}`,
      {},
      InsertTweetResponseSchema,
    );
  }

  /**
   * Batch insert tweets with concurrency control
   *
   * This method processes tweets in chunks to avoid overwhelming the API
   * and provides detailed results about successes and failures.
   *
   * @param tweets - Array of tweets to insert
   * @param options - Batch processing options
   * @returns Result summary with successful inserts and failed tweet IDs
   */
  async insertBatch(
    tweets: InsertTweetParams[],
    options: {
      batchSize?: number;
      stopOnError?: boolean;
    } = {},
  ): Promise<BatchInsertResult> {
    const { batchSize = 4, stopOnError = false } = options;

    const results: SwarmTweet[] = [];
    const errorIds: string[] = [];
    let totalProcessed = 0;

    // Process tweets in batches
    for (let i = 0; i < tweets.length; i += batchSize) {
      const chunk = tweets.slice(i, i + batchSize);

      // Process this chunk with limited concurrency
      const chunkPromises = chunk.map(async (tweet) => {
        try {
          const result = await this.insert(tweet);
          return { success: true, result, tweetId: tweet.tweet_id } as const;
        } catch (error) {
          return { success: false, error, tweetId: tweet.tweet_id } as const;
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);

      // Process the results from this chunk
      for (const promiseResult of chunkResults) {
        totalProcessed++;

        if (promiseResult.status === "fulfilled") {
          const { success, result, tweetId, error } = promiseResult.value;
          if (success) {
            results.push(result);
          } else {
            errorIds.push(tweetId);
            console.error(`Error inserting tweet ${tweetId}:`, error);

            if (stopOnError) {
              // Return early results if configured to stop on error
              return {
                results,
                errorIds,
                totalProcessed,
                successCount: results.length,
                errorCount: errorIds.length,
              };
            }
          }
        } else {
          // This should rarely happen as we're catching errors in the inner promises
          console.error("Unexpected promise rejection:", promiseResult.reason);
        }
      }

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < tweets.length) {
        await this.sleep(100);
      }
    }

    return {
      results,
      errorIds,
      totalProcessed,
      successCount: results.length,
      errorCount: errorIds.length,
    };
  }

  /**
   * Legacy compatibility method for playground APITweet interface
   *
   * @param tweet - Tweet in APITweet format (from playground)
   * @returns Inserted SwarmTweet
   */
  async insertLegacy(tweet: APITweet): Promise<SwarmTweet> {
    return this.insert(tweet);
  }

  /**
   * Batch insert legacy tweets (playground compatibility)
   *
   * @param tweets - Array of tweets in APITweet format
   * @returns Result summary
   */
  async insertLegacyBatch(tweets: APITweet[]): Promise<BatchInsertResult> {
    return this.insertBatch(tweets);
  }

  /**
   * Search tweets by text content
   *
   * @param query - Search query
   * @param params - Additional filtering parameters
   * @returns Array of matching tweets
   */
  async search(
    query: string,
    params?: Omit<ListTweetsParams, "search">,
  ): Promise<SwarmTweet[]> {
    const searchParams = {
      ...params,
      search: query,
    };

    return this.list(searchParams);
  }

  /**
   * Get tweets by specific author
   *
   * @param username - Twitter username (without @)
   * @param params - Additional filtering parameters
   * @returns Array of tweets from the specified author
   */
  async getByAuthor(
    username: string,
    params?: Omit<ListTweetsParams, "author_username">,
  ): Promise<SwarmTweet[]> {
    const authorParams = {
      ...params,
      author_username: username,
    };

    return this.list(authorParams);
  }

  /**
   * Get recent tweets (last 24 hours)
   *
   * @param params - Additional filtering parameters
   * @returns Array of recent tweets
   */
  async getRecent(
    params?: Omit<ListTweetsParams, "from">,
  ): Promise<SwarmTweet[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentParams = {
      ...params,
      from: yesterday.toISOString(),
      sort_order: "desc" as const,
    };

    return this.list(recentParams);
  }

  /**
   * Get IDs of all tweets stored in SwarmMemory
   *
   * Returns a list of tweet IDs (Twitter snowflake IDs) that are already
   * stored in the database. This is useful for deduplication when syncing.
   *
   * @returns Array of objects with internal ID and Twitter tweet_id
   */
  async getIds(): Promise<TweetIdsResponse> {
    // Note: The actual endpoint path needs to be added to constants
    // Assuming it follows the pattern: api/tweets/ids
    return this.client.get("api/tweets/ids", {}, TweetIdsResponseSchema);
  }

  /**
   * Get tweet IDs as a Set for efficient lookups
   *
   * @returns Set of Twitter tweet IDs (snowflake IDs as strings)
   */
  async getIdsAsSet(): Promise<Set<string>> {
    const ids = await this.getIds();
    return new Set(ids.map((item) => item.tweet_id));
  }

  /**
   * Simple sleep utility for batch processing
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
