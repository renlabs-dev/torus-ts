import type { Signer as InjectedSigner } from "@polkadot/api/types";
import { z } from "zod";
import { BaseAPIClient } from "../base-api-client/base-client.js";
import type { BaseClientConfig } from "../base-api-client/base-client.js";
import { SwarmAuth } from "./auth/swarm-auth.js";
import { DEFAULT_SWARM_CONFIG, SWARM_API_BASE_URL } from "./utils/constants.js";
import { SwarmMemoryError, SwarmValidationError } from "./utils/errors.js";

/**
 * Configuration for SwarmMemory API client
 */
export interface SwarmMemoryClientConfig {
  /** Pre-initialized SwarmAuth instance */
  auth: SwarmAuth;
  baseUrl?: string;
  timeout?: number;
}

/**
 * SwarmMemory API client extending BaseAPIClient
 *
 * Provides base HTTP functionality with SwarmMemory-specific configuration:
 * - Wallet-based authentication via SwarmAuth
 * - Custom error handling for SwarmMemory API responses
 * - Validation using Zod schemas
 * - Automatic retry with exponential backoff
 *
 * This class is extended by the main SwarmMemory client which adds endpoint groups.
 *
 * **Note:** Use the static `fromMnemonic()` or `fromInjector()` factory methods
 * instead of the constructor directly.
 *
 * @example
 * ```ts
 * // Create from mnemonic
 * const client = await SwarmMemory.fromMnemonic({
 *   mnemonic: 'your twelve word mnemonic phrase here',
 *   baseUrl: 'https://memory.sension.torus.directory',
 *   timeout: 30000
 * });
 *
 * // Create from browser injector
 * const injector = await web3FromAddress(address);
 * const client = SwarmMemory.fromInjector({
 *   injectedSigner: injector.signer,
 *   address
 * });
 *
 * // Or with pre-initialized auth (advanced)
 * const auth = await SwarmAuth.fromMnemonic('your mnemonic');
 * const client = new BaseSwarmMemoryApiClient({ auth });
 * ```
 */
export class BaseSwarmMemoryApiClient extends BaseAPIClient {
  readonly auth: SwarmAuth;

  constructor(config: SwarmMemoryClientConfig) {
    const baseConfig: BaseClientConfig = {
      baseUrl: config.baseUrl || SWARM_API_BASE_URL,
      auth: config.auth,
      timeout: config.timeout || DEFAULT_SWARM_CONFIG.timeout,
      retryConfig: DEFAULT_SWARM_CONFIG.retryConfig,
      defaultHeaders: {
        "Content-Type": "application/json",
        "User-Agent": "torus-swarm-bot/1.0",
      },
    };

    super(baseConfig);
    this.auth = config.auth;
  }

  /**
   * Create Swarm Memory base client from a mnemonic phrase.
   *
   * @param config - Configuration with mnemonic and optional settings
   *
   * @example
   * ```ts
   * const client = await BaseSwarmMemoryApiClient.fromMnemonic({
   *   mnemonic: 'your twelve word mnemonic phrase',
   *   baseUrl: 'https://memory.sension.torus.directory'
   * });
   * ```
   */
  static async fromMnemonic(config: {
    mnemonic: string;
    baseUrl?: string;
    timeout?: number;
  }): Promise<BaseSwarmMemoryApiClient> {
    const auth = await SwarmAuth.fromMnemonic(config.mnemonic, config.baseUrl);
    return new BaseSwarmMemoryApiClient({
      auth,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /**
   * Create Swarm Memory base client from a browser wallet injector.
   *
   * @param config - Configuration with injector, address and optional settings
   *
   * @example
   * ```ts
   * const injector = await web3FromAddress(selectedAddress);
   * const client = BaseSwarmMemoryApiClient.fromInjector({
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
  }): BaseSwarmMemoryApiClient {
    const auth = SwarmAuth.fromInjector(
      config.injectedSigner,
      config.address,
      config.baseUrl,
    );
    return new BaseSwarmMemoryApiClient({
      auth,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  /**
   * Override validateResponse to handle SwarmMemory-specific error responses
   */
  protected override validateResponse<T>(
    data: unknown,
    schema: z.ZodType<T>,
  ): T {
    try {
      const validated = schema.parse(data);

      // Check if response indicates an error
      if (
        typeof validated === "object" &&
        validated !== null &&
        "success" in validated &&
        validated.success === false
      ) {
        const errorData = validated as {
          success: false;
          error?: string;
          message?: string;
        };

        throw new SwarmMemoryError(
          errorData.error || errorData.message || "API request failed",
        );
      }

      return validated;
    } catch (error) {
      if (error instanceof SwarmMemoryError) {
        throw error; // Re-throw SwarmMemory API errors
      }
      if (error instanceof z.ZodError) {
        throw new SwarmValidationError("Response validation failed", error);
      }
      throw error;
    }
  }

  /**
   * Helper method to unwrap SwarmMemory API responses
   *
   * Many SwarmMemory endpoints return data wrapped in { success: true, data: T }
   */
  async getUnwrapped<T>(
    url: string,
    params: Record<string, string | number | boolean | undefined>,
    dataSchema: z.ZodType<T>,
  ): Promise<T> {
    const wrappedSchema = z.object({
      success: z.literal(true),
      data: dataSchema,
      message: z.string().optional(),
    });

    const response = await this.get(url, params, wrappedSchema);
    return response.data as T;
  }

  /**
   * Helper method to post with unwrapped response
   */
  async postUnwrapped<T>(
    url: string,
    body: unknown,
    dataSchema: z.ZodType<T>,
  ): Promise<T> {
    const wrappedSchema = z.object({
      success: z.literal(true),
      data: dataSchema,
      message: z.string().optional(),
    });

    const response = await this.post(url, body, wrappedSchema);
    return response.data as T;
  }

  /**
   * Get wallet address from auth provider
   */
  async getWalletAddress(): Promise<string> {
    return this.auth.getWalletAddress();
  }
}
