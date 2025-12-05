import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { blake2AsHex, cryptoWaitReady } from "@polkadot/util-crypto";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import canonicalize from "canonicalize";

const logger = BasicLogger.create({ name: "swarm-filter:elysia-client" });

/**
 * Raw tweet data as returned by the API (date as string).
 */
interface RawTweet {
  id: string;
  text: string;
  authorId: string;
  date: string;
  quotedId: string | null;
  conversationId: string | null;
  parentTweetId: string | null;
}

/**
 * Raw response from getTweetsNext endpoint (dates as strings).
 */
interface RawGetTweetsNextResponse {
  tweets: {
    main: RawTweet;
    context: Record<string, RawTweet>;
  }[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Tweet data structure with parsed Date.
 */
export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  date: Date;
  quotedId: string | null;
  conversationId: string | null;
  parentTweetId: string | null;
}

/**
 * Response from getTweetsNext endpoint with parsed dates.
 */
export interface GetTweetsNextResponse {
  tweets: {
    main: Tweet;
    context: Record<string, Tweet>;
  }[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Parameters for getTweetsNext endpoint
 */
export interface GetTweetsNextParams {
  from: string;
  limit?: number;
  excludeProcessedByAgent?: boolean;
}

/**
 * Prediction content for storePredictions endpoint
 */
export interface PredictionContent {
  tweetId: string;
  sentAt: string;
  prediction: {
    target: { source: { tweet_id: string }; start: number; end: number }[];
    timeframe: {
      source: { tweet_id: string };
      start: number;
      end: number;
    }[];
    topicName: string;
    predictionQuality: number;
    briefRationale: string;
    llmConfidence: string;
    vagueness?: string;
    context?: unknown;
  };
}

/**
 * Single prediction item for storePredictions endpoint
 */
export interface StorePredictionItem {
  content: PredictionContent;
  metadata: {
    signature: string;
    version: 1;
  };
}

/**
 * Response from storePredictions endpoint
 */
export interface StorePredictionsResponse {
  inserted: number;
  receipt: {
    signature: string;
    timestamp: string;
  };
}

/**
 * Elysia REST API client for the Prediction Swarm API.
 * Uses per-request signature authentication.
 */
export class ElysiaAPIClient {
  private apiUrl: string;
  private keypair: ReturnType<InstanceType<typeof Keyring>["addFromUri"]>;
  private address: string;

  private constructor(
    apiUrl: string,
    keypair: ReturnType<InstanceType<typeof Keyring>["addFromUri"]>,
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.keypair = keypair;
    this.address = keypair.address;
  }

  /**
   * Create a new ElysiaAPIClient instance.
   */
  static async create(
    apiUrl: string,
    mnemonic: string,
  ): Promise<ElysiaAPIClient> {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const keypair = keyring.addFromUri(mnemonic);

    logger.info(`Created Elysia API client for address: ${keypair.address}`);
    logger.info(`API URL: ${apiUrl}`);

    return new ElysiaAPIClient(apiUrl, keypair);
  }

  /**
   * Get the agent's SS58 address.
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Generate authentication headers for a request.
   * Signs { address, timestamp } with the agent's keypair.
   */
  private generateAuthHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString();

    const payload = {
      address: this.address,
      timestamp,
    };

    const payloadCanonical = canonicalize(payload);
    if (!payloadCanonical) {
      throw new Error("Failed to canonicalize auth payload");
    }

    const payloadHash = blake2AsHex(payloadCanonical);
    const signature = u8aToHex(this.keypair.sign(payloadHash));

    return {
      "x-agent-address": this.address,
      "x-signature": signature,
      "x-timestamp": timestamp,
      "Content-Type": "application/json",
    };
  }

  /**
   * Make an authenticated GET request.
   */
  private async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.apiUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.generateAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make an authenticated POST request.
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.generateAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Transform a raw tweet from API response to parsed Tweet with Date.
   */
  private transformTweet(raw: RawTweet): Tweet {
    return {
      ...raw,
      date: new Date(raw.date),
    };
  }

  /**
   * Get next batch of tweets to process.
   */
  async getTweetsNext(
    params: GetTweetsNextParams,
  ): Promise<GetTweetsNextResponse> {
    const raw = await this.get<RawGetTweetsNextResponse>("/v1/getTweetsNext", {
      from: params.from,
      limit: params.limit,
      excludeProcessedByAgent: params.excludeProcessedByAgent,
    });

    // Transform dates from ISO strings to Date objects
    return {
      ...raw,
      tweets: raw.tweets.map((t) => ({
        main: this.transformTweet(t.main),
        context: Object.fromEntries(
          Object.entries(t.context).map(([id, tweet]) => [
            id,
            this.transformTweet(tweet),
          ]),
        ),
      })),
    };
  }

  /**
   * Store extracted predictions.
   */
  async storePredictions(
    data: StorePredictionItem[],
  ): Promise<StorePredictionsResponse> {
    return this.post<StorePredictionsResponse>("/v1/storePredictions", data);
  }
}
