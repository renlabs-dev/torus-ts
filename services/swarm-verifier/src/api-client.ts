import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { blake2AsHex, cryptoWaitReady } from "@polkadot/util-crypto";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import canonicalize from "canonicalize";

const logger = BasicLogger.create({ name: "swarm-verifier:api-client" });

interface PostSlice {
  source: { tweet_id: string };
  start: number;
  end: number;
}

interface ClaimablePrediction {
  id: string;
  predictionId: string;
  target: PostSlice[];
  timeframe: PostSlice[];
  topicName: string;
  createdAt: string;
}

interface ClaimableResponse {
  predictions: ClaimablePrediction[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface PredictionTweet {
  id: string;
  text: string;
  authorUsername: string | null;
  date: string;
}

interface PredictionContext {
  id: string;
  predictionId: string;
  target: PostSlice[];
  timeframe: PostSlice[];
  tweets: PredictionTweet[];
  topicName: string;
}

interface ClaimSource {
  url: string;
  title?: string;
  snippet?: string;
  retrievedAt: string;
  archiveUrl?: string;
}

interface ClaimContent {
  outcome: boolean;
  confidence: string;
  reasoning: string;
  sources: ClaimSource[];
  timeframe: {
    startUtc: string;
    endUtc: string;
    precision: string;
  };
  sentAt: string;
}

interface FeedbackContent {
  failureCause: string;
  reason: string;
  sentAt: string;
}

/**
 * Swarm API client for open verifiers.
 * Uses per-request signature authentication.
 */
export class SwarmApiClient {
  private apiUrl: string;
  private keypair: ReturnType<InstanceType<typeof Keyring>["addFromUri"]>;
  private address: string;

  private constructor(
    apiUrl: string,
    keypair: ReturnType<InstanceType<typeof Keyring>["addFromUri"]>,
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.keypair = keypair;
    this.address = keypair.address;
  }

  static async create(
    apiUrl: string,
    mnemonic: string,
  ): Promise<SwarmApiClient> {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const keypair = keyring.addFromUri(mnemonic);

    logger.info(`Created API client for address: ${keypair.address}`);
    logger.info(`API URL: ${apiUrl}`);

    return new SwarmApiClient(apiUrl, keypair);
  }

  getAddress(): string {
    return this.address;
  }

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

  private signContent<T extends object>(content: T): string {
    const canonical = canonicalize(content);
    if (!canonical) {
      throw new Error("Failed to canonicalize content");
    }
    const hash = blake2AsHex(canonical);
    const signature = u8aToHex(this.keypair.sign(hash));
    return signature;
  }

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

  async getClaimablePredictions(
    after?: string,
    limit = 50,
    topics?: string[],
  ): Promise<ClaimableResponse> {
    return this.get<ClaimableResponse>("/v1/predictions/claimable", {
      after,
      limit,
      topics: topics?.join(","),
    });
  }

  async getPredictionContext(predictionId: string): Promise<PredictionContext> {
    return this.get<PredictionContext>(
      `/v1/predictions/${predictionId}/context`,
    );
  }

  async submitClaim(
    predictionId: string,
    outcome: boolean,
    confidence: number,
    reasoning: string,
    sources: ClaimSource[],
    timeframe: { startUtc: string; endUtc: string; precision: string },
  ): Promise<{ claimId: string; parsedPredictionId: string }> {
    const content: ClaimContent = {
      outcome,
      confidence: confidence.toFixed(2),
      reasoning,
      sources,
      timeframe,
      sentAt: new Date().toISOString(),
    };

    const signature = this.signContent(content);

    const body = {
      content,
      metadata: {
        signature,
        version: 1,
      },
    };

    return this.post(`/v1/predictions/${predictionId}/claim`, body);
  }

  async submitFeedback(
    predictionId: string,
    failureCause: string,
    reason: string,
  ): Promise<{ feedbackId: string; parsedPredictionId: string }> {
    const content: FeedbackContent = {
      failureCause,
      reason,
      sentAt: new Date().toISOString(),
    };

    const signature = this.signContent(content);

    const body = {
      content,
      metadata: {
        signature,
        version: 1,
      },
    };

    return this.post(`/v1/predictions/${predictionId}/feedback`, body);
  }
}

export type {
  ClaimablePrediction,
  ClaimableResponse,
  ClaimSource,
  PostSlice,
  PredictionContext,
  PredictionTweet,
};
