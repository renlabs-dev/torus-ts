import type { Signer as InjectedSigner } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { SwarmAuthenticationError } from "../utils/errors.js";
import { assert } from "tsafe";

/**
 * Unified signing interface for SwarmAuth authentication.
 *
 * Abstracts over different signing mechanisms (keypair, browser injector)
 * to provide a consistent interface for message signing and address retrieval.
 */
export interface Signer {
  /**
   * Sign a message and return the signature.
   * @param message - The message to sign as a byte array
   */
  sign(message: Uint8Array): Promise<Uint8Array>;

  /**
   * Get the wallet address associated with this signer.
   */
  getAddress(): Promise<string>;
}

/**
 * Signer implementation using Polkadot KeyringPair.
 *
 * Used for server-side or local authentication where the private key
 * is directly available (e.g., from a mnemonic).
 *
 * @example
 * ```ts
 * const keyring = new Keyring({ type: "sr25519" });
 * const keypair = keyring.addFromUri(mnemonic);
 * const signer = new KeypairSigner(keypair);
 * ```
 */
export class KeypairSigner implements Signer {
  constructor(private readonly keypair: KeyringPair) {}

  async sign(message: Uint8Array): Promise<Uint8Array> {
    try {
      return this.keypair.sign(message);
    } catch (error) {
      throw new SwarmAuthenticationError(
        `Failed to sign with keypair: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getAddress(): Promise<string> {
    return this.keypair.address;
  }
}

/**
 * Signer implementation using browser extension injector.
 *
 * Used for browser-based authentication where signing happens through
 * a wallet extension (e.g., Polkadot.js extension, Talisman, SubWallet).
 *
 * @example
 * ```ts
 * const injector = await web3FromAddress(address);
 * const signer = new InjectorSigner(injector.signer, address);
 * ```
 */
export class InjectorSigner implements Signer {
  constructor(
    private readonly injectedSigner: InjectedSigner,
    private readonly address: string,
  ) {
    if (!injectedSigner.signRaw) {
      throw new SwarmAuthenticationError(
        "Injected signer does not support signRaw method",
      );
    }
  }

  async sign(message: Uint8Array): Promise<Uint8Array> {
    try {
      // Convert message to hex format required by signRaw
      const messageHex = u8aToHex(message);

      assert(this.injectedSigner.signRaw, "Injected signer does not support signRaw method");
      const result = await this.injectedSigner.signRaw({
        address: this.address,
        data: messageHex,
        type: "bytes",
      });

      // Convert hex signature back to Uint8Array
      return hexToU8a(result.signature);
    } catch (error) {
      throw new SwarmAuthenticationError(
        `Failed to sign with injector: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getAddress(): Promise<string> {
    return this.address;
  }
}
