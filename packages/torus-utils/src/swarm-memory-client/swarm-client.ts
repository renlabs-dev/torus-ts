import type { Signer as InjectedSigner } from "@polkadot/api/types";
import { BaseSwarmMemoryApiClient } from "./client.js";
import type { SwarmMemoryClientConfig } from "./client.js";
import { TasksEndpoint } from "./endpoints/tasks.js";
import { TweetsEndpoint } from "./endpoints/tweets.js";

/**
 * SwarmMemory - Main client for interacting with SwarmMemory API
 *
 * This is the primary client class that provides access to all SwarmMemory endpoints
 * through organized endpoint groups. It extends the base API client with
 * SwarmMemory-specific functionality and wallet-based authentication.
 *
 * Features:
 * - Wallet-based authentication using Polkadot/Substrate keys
 * - Full TypeScript support with Zod schema validation
 * - Automatic retry with exponential backoff
 * - Rate limit handling
 * - Comprehensive error handling
 * - Tweet data storage and retrieval
 * - Batch operations with concurrency control
 *
 * **Note:** Use the static `fromMnemonic()` or `fromInjector()` factory methods
 * instead of the constructor directly.
 *
 * @example
 * ```ts
 * import { SwarmMemory } from '@torus-network/torus-utils/swarm-memory-client';
 *
 * // Create from mnemonic
 * const client = await SwarmMemory.fromMnemonic({
 *   mnemonic: 'your twelve word mnemonic phrase here',
 *   baseUrl: 'https://memory.sension.torus.directory', // optional
 *   timeout: 30000 // optional
 * });
 *
 * // Create from browser injector
 * const injector = await web3FromAddress(address);
 * const client = SwarmMemory.fromInjector({
 *   injectedSigner: injector.signer,
 *   address
 * });
 *
 * // List recent tweets
 * const tweets = await client.tweets.list({ limit: 10 });
 *
 * // Insert a tweet
 * const tweet = await client.tweets.insert({
 *   tweet_id: '1234567890',
 *   author_twitter_username: 'elonmusk',
 *   full_text: 'Hello from SwarmMemory!',
 *   tweet_timestamp: new Date().toISOString(),
 *   url: 'https://twitter.com/elonmusk/status/1234567890',
 *   tweet_type: 'original',
 *   raw_json: JSON.stringify({})
 * });
 *
 * // Batch insert tweets
 * const result = await client.tweets.insertBatch(tweets);
 * console.log(`Inserted ${result.successCount} tweets, ${result.errorCount} failed`);
 * ```
 */
export class SwarmMemoryClient extends BaseSwarmMemoryApiClient {
  /** Tweet data endpoints */
  public readonly tweets: TweetsEndpoint;
  /** Task management endpoints */
  public readonly tasks: TasksEndpoint;

  constructor(config: SwarmMemoryClientConfig) {
    super(config);

    // Initialize endpoint groups
    this.tweets = new TweetsEndpoint(this);
    this.tasks = new TasksEndpoint(this);
  }

  /**
   * Create SwarmMemory client from a mnemonic phrase.
   *
   * @param config - Configuration with mnemonic and optional settings
   *
   * @example
   * ```ts
   * const client = await SwarmMemory.fromMnemonic({
   *   mnemonic: 'your twelve word mnemonic phrase',
   *   baseUrl: 'https://memory.sension.torus.directory'
   * });
   * ```
   */
  static async fromMnemonic(config: {
    mnemonic: string;
    baseUrl?: string;
    timeout?: number;
  }): Promise<SwarmMemoryClient> {
    const apiClient = await BaseSwarmMemoryApiClient.fromMnemonic(config);
    return new SwarmMemoryClient({
      auth: apiClient.auth,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /**
   * Create SwarmMemory client from a browser wallet injector.
   *
   * @param config - Configuration with injector, address and optional settings
   *
   * @example
   * ```ts
   * const injector = await web3FromAddress(selectedAddress);
   * const client = SwarmMemory.fromInjector({
   *   injectedSigner: injector.signer,
   *   address: selectedAddress,
   *   baseUrl: 'https://memory.sension.torus.directory'
   * });
   * ```
   */
  static fromInjector(config: {
    injectedSigner: InjectedSigner;
    address: string;
    baseUrl?: string;
    timeout?: number;
  }): SwarmMemoryClient {
    const apiClient = BaseSwarmMemoryApiClient.fromInjector(config);
    return new SwarmMemoryClient({
      auth: apiClient.auth,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /**
   * Health check - verify API connectivity and authentication
   *
   * @returns True if the API is accessible and authentication works
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list tweets as a basic connectivity test
      await this.tweets.list({ limit: 1 });
      return true;
    } catch (error) {
      console.error("SwarmMemory health check failed:", error);
      return false;
    }
  }
}
