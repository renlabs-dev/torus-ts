import { KaitoTwitterAPIClient } from "./client";
import { ActionsEndpoint } from "./endpoints/actions";
import { TweetsEndpoint } from "./endpoints/tweets";
import { UsersEndpoint } from "./endpoints/users";
import type { KaitoClientConfig } from "./types";

/**
 * KaitoTwitterAPI - A comprehensive TypeScript client for the KaitoTwitterAPI service
 *
 * Features:
 * - Full TypeScript support with Zod schema validation
 * - Automatic retry with exponential backoff
 * - Rate limit handling
 * - Comprehensive error handling
 * - Pagination support
 *
 * @example
 * ```ts
 * const client = new KaitoTwitterAPI({ apiKey: 'your-api-key' });
 *
 * // Get user info
 * const user = await client.users.getInfo({ userName: 'elonmusk' });
 *
 * // Login and create tweet
 * const { login_cookie } = await client.actions.login({
 *   email: 'your@email.com',
 *   user_name: 'username',
 *   password: 'password',
 *   proxy: 'http://proxy:port'
 * });
 *
 * await client.actions.createTweet({
 *   text: 'Hello from KaitoTwitterAPI!',
 *   login_cookie
 * });
 * ```
 */
export class KaitoTwitterAPI extends KaitoTwitterAPIClient {
  public readonly users: UsersEndpoint;
  public readonly tweets: TweetsEndpoint;
  public readonly actions: ActionsEndpoint;

  constructor(config: KaitoClientConfig) {
    super(config);

    // Initialize endpoint groups
    this.users = new UsersEndpoint(this);
    this.tweets = new TweetsEndpoint(this);
    this.actions = new ActionsEndpoint(this);
  }

  /**
   * Get the API key (masked for security)
   */
  getApiKeyInfo(): string {
    const key = this.apiKey;
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use a simple user info call as health check
      await this.users.getInfo({ userName: "twitter" });
      return true;
    } catch (error) {
      console.error("KaitoTwitterAPI health check failed:", error);
      return false;
    }
  }
}
