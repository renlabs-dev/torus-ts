import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { RouterInputs, RouterOutputs } from "@torus-ts/api";
import * as jwt from "jsonwebtoken";
import { authenticateWithAPI, createAuthenticatedTRPCClient } from "./auth";

const logger = BasicLogger.create({ name: "swarm-filter:api-client" });

/**
 * API client wrapper with automatic token refresh.
 * Proactively refreshes JWT tokens 1 hour before expiration.
 */
export class RefreshingAPIClient {
  private api: ReturnType<typeof createAuthenticatedTRPCClient>;
  private token: string;
  private tokenExpiresAt: number;
  private apiUrl: string;
  private authOrigin: string;
  private mnemonic: string;

  private constructor(
    apiUrl: string,
    authOrigin: string,
    mnemonic: string,
    token: string,
  ) {
    this.apiUrl = apiUrl;
    this.authOrigin = authOrigin;
    this.mnemonic = mnemonic;
    this.token = token;
    this.tokenExpiresAt = this.getTokenExpiration(token);
    this.api = createAuthenticatedTRPCClient(apiUrl, () => this.token);
  }

  /**
   * Create a new RefreshingAPIClient instance with authentication.
   */
  static async create(
    apiUrl: string,
    authOrigin: string,
    mnemonic: string,
  ): Promise<RefreshingAPIClient> {
    logger.info("Authenticating with API...");
    const token = await authenticateWithAPI(apiUrl, authOrigin, mnemonic);
    logger.info("Authentication successful (token valid for 6 hours)");

    return new RefreshingAPIClient(apiUrl, authOrigin, mnemonic, token);
  }

  /**
   * Extract expiration time from JWT Bearer token.
   */
  private getTokenExpiration(bearerToken: string): number {
    const token = bearerToken.replace("Bearer ", "");
    const decoded = jwt.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) {
      throw new Error("Invalid token: no expiration claim");
    }

    return decoded.exp * 1000;
  }

  /**
   * Ensure token is valid, refresh if expires in < 1 hour.
   */
  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (this.tokenExpiresAt - now < oneHour) {
      logger.info("Token expires soon, refreshing...");
      this.token = await authenticateWithAPI(
        this.apiUrl,
        this.authOrigin,
        this.mnemonic,
      );
      this.tokenExpiresAt = this.getTokenExpiration(this.token);
      logger.info("Token refreshed successfully");
    }
  }

  /**
   * Get next batch of tweets to process.
   */
  async getTweetsNext(
    params: RouterInputs["prophet"]["getTweetsNext"],
  ): Promise<RouterOutputs["prophet"]["getTweetsNext"]> {
    await this.ensureValidToken();
    return this.api.prophet.getTweetsNext.query(params);
  }

  /**
   * Store extracted predictions.
   */
  async storePredictions(
    data: RouterInputs["prophet"]["storePredictions"],
  ): Promise<RouterOutputs["prophet"]["storePredictions"]> {
    await this.ensureValidToken();
    return this.api.prophet.storePredictions.mutate(data);
  }

  /**
   * Get current filter cursor position.
   */
  async getFilterCursor(): Promise<
    RouterOutputs["swarmFilter"]["getFilterCursor"]
  > {
    await this.ensureValidToken();
    return this.api.swarmFilter.getFilterCursor.query();
  }

  /**
   * Update filter cursor position.
   */
  async updateFilterCursor(
    params: RouterInputs["swarmFilter"]["updateFilterCursor"],
  ): Promise<RouterOutputs["swarmFilter"]["updateFilterCursor"]> {
    await this.ensureValidToken();
    return this.api.swarmFilter.updateFilterCursor.mutate(params);
  }
}
