import type { Signer as InjectedSigner } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import { stringToU8a, u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { AuthStrategy } from "../../base-api-client/auth/strategies.js";
import { SWARM_API_BASE_URL, SWARM_ENDPOINTS } from "../utils/constants.js";
import { SwarmAuthenticationError } from "../utils/errors.js";
import { InjectorSigner, KeypairSigner  } from "./signers.js";
import type {Signer} from "./signers.js";

/**
 * Session token with expiration
 */
interface SessionToken {
  token: string;
  expiresAt: Date;
}

/**
 * Challenge response from SwarmMemory API
 */
interface ChallengeResponse {
  challenge_token: string;
  message: string;
}

/**
 * Signature verification response
 */
interface VerifyResponse {
  session_token: string;
}

/**
 * SwarmAuth implements AuthStrategy for wallet-based authentication with SwarmMemory API
 *
 * Handles the complete authentication flow:
 * 1. Create challenge with wallet address
 * 2. Sign challenge message with private key (via keypair or browser injector)
 * 3. Verify signature and receive session token
 * 4. Cache token with expiration handling
 *
 * Use factory methods to create instances:
 * - `fromMnemonic()` for server-side or local authentication
 * - `fromInjector()` for browser wallet authentication
 *
 * @example
 * ```ts
 * // Server-side with mnemonic
 * const auth = await SwarmAuth.fromMnemonic('your twelve word mnemonic');
 *
 * // Browser with injector
 * const injector = await web3FromAddress(address);
 * const auth = SwarmAuth.fromInjector(injector.signer, address);
 * ```
 */
export class SwarmAuth implements AuthStrategy {
  private sessionToken: SessionToken | null = null;
  private readonly apiBaseUrl: string;

  private constructor(
    private readonly signer: Signer,
    apiBaseUrl: string = SWARM_API_BASE_URL,
  ) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Create SwarmAuth from a mnemonic phrase.
   *
   * Used for server-side or local authentication where you have direct
   * access to the private key.
   *
   * @param mnemonic - The 12 or 24 word mnemonic phrase
   * @param apiBaseUrl - Optional SwarmMemory API base URL
   *
   * @example
   * ```ts
   * const auth = await SwarmAuth.fromMnemonic('your twelve word mnemonic');
   * const client = new SwarmMemoryAPIClient({ auth });
   * ```
   */
  static async fromMnemonic(
    mnemonic: string,
    apiBaseUrl?: string,
  ): Promise<SwarmAuth> {
    // Wait for WASM crypto to be ready
    await cryptoWaitReady();

    // Create keypair from mnemonic
    const keyring = new Keyring({ type: "sr25519" });
    const keypair = keyring.addFromUri(mnemonic);
    const signer = new KeypairSigner(keypair);

    return new SwarmAuth(signer, apiBaseUrl);
  }

  /**
   * Create SwarmAuth from a browser wallet injector.
   *
   * Used for browser-based authentication where signing happens through
   * a wallet extension (e.g., Polkadot.js extension, Talisman).
   *
   * @param injectedSigner - The signer from web3FromAddress()
   * @param address - The wallet address
   * @param apiBaseUrl - Optional SwarmMemory API base URL
   *
   * @example
   * ```ts
   * const injector = await web3FromAddress(selectedAddress);
   * const auth = SwarmAuth.fromInjector(injector.signer, selectedAddress);
   * const client = new SwarmMemoryAPIClient({ auth });
   * ```
   */
  static fromInjector(
    injectedSigner: InjectedSigner,
    address: string,
    apiBaseUrl?: string,
  ): SwarmAuth {
    const signer = new InjectorSigner(injectedSigner, address);
    return new SwarmAuth(signer, apiBaseUrl);
  }

  /**
   * Authenticate a request by adding Bearer token (implements AuthStrategy)
   */
  async authenticate(request: Request): Promise<void> {
    const token = await this.getToken();
    request.headers.set("Authorization", `Bearer ${token}`);
  }

  /**
   * Check if current token is valid (implements AuthStrategy)
   */
  isValid(): Promise<boolean> {
    return Promise.resolve(
      this.sessionToken !== null && this.sessionToken.expiresAt > new Date(),
    );
  }

  /**
   * Refresh authentication token (implements AuthStrategy)
   */
  async refresh(): Promise<void> {
    this.sessionToken = null;
    await this.getTokenInternal();
  }

  /**
   * Get authentication token (internal method)
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.sessionToken && this.sessionToken.expiresAt > new Date()) {
      return this.sessionToken.token;
    }

    // Authenticate to get new token
    return this.getTokenInternal();
  }

  /**
   * Clear the cached token
   */
  clearToken(): void {
    this.sessionToken = null;
  }

  /**
   * Get wallet address
   */
  async getWalletAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  /**
   * Perform complete authentication flow and return token
   */
  private async getTokenInternal(): Promise<string> {
    try {
      const challengeData = await this.createChallenge();
      const signedChallenge = await this.signChallenge(
        challengeData.message,
        challengeData.challenge_token,
      );
      const token = await this.verifySignature(signedChallenge);

      this.sessionToken = {
        token,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      return token;
    } catch (error) {
      throw new SwarmAuthenticationError(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Create challenge with wallet address
   */
  private async createChallenge(): Promise<ChallengeResponse> {
    const walletAddress = await this.signer.getAddress();

    const response = await fetch(
      `${this.apiBaseUrl}/${SWARM_ENDPOINTS.AUTH_CHALLENGE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      },
    );

    if (!response.ok) {
      throw new SwarmAuthenticationError(
        `Failed to create challenge: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<ChallengeResponse>;
  }

  /**
   * Sign challenge message with signer
   */
  private async signChallenge(
    message: string,
    challengeToken: string,
  ): Promise<{ challenge_token: string; signature: string }> {
    try {
      // Convert message string to Uint8Array for signing
      const messageBytes = stringToU8a(message);

      // Sign the message (not the token) with the signer
      const signature = await this.signer.sign(messageBytes);
      const signatureHex = u8aToHex(signature).slice(2); // Remove '0x' prefix

      return {
        challenge_token: challengeToken,
        signature: signatureHex,
      };
    } catch (error) {
      throw new SwarmAuthenticationError(
        `Failed to sign challenge: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Verify signature and receive session token
   */
  private async verifySignature(signedChallenge: {
    challenge_token: string;
    signature: string;
  }): Promise<string> {
    const response = await fetch(
      `${this.apiBaseUrl}/${SWARM_ENDPOINTS.AUTH_VERIFY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signedChallenge),
      },
    );

    if (!response.ok) {
      throw new SwarmAuthenticationError(
        `Failed to verify signature: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as VerifyResponse;
    return data.session_token;
  }
}
