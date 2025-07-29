import {
  cryptoWaitReady,
  encodeAddress,
  mnemonicToMiniSecret,
  sr25519PairFromSeed,
  sr25519Sign,
} from "@polkadot/util-crypto";
import base64url from "base64url";
import { randomUUID } from "crypto";
import { getCurrentProtocolVersion } from "../agent/jwt-sr25519.js";

export class Keypair {
  private mnemonic: string;
  private seed: Uint8Array<ArrayBufferLike> | null = null;
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  private address: string | null = null;
  private initialized: Promise<void>;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
    this.initialized = this.init();
  }

  private async init() {
    await cryptoWaitReady();

    this.seed = mnemonicToMiniSecret(this.mnemonic);
    const { publicKey, secretKey } = sr25519PairFromSeed(this.seed);

    this.publicKey = this.toHex(publicKey);
    this.privateKey = this.toHex(secretKey);
    this.address = encodeAddress(publicKey, 42);
  }

  async getKeyInfo() {
    await this.initialized;

    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      address: this.address,
    };
  }

  async createJWT() {
    await this.initialized;

    if (!this.publicKey || !this.privateKey || !this.address) {
      throw new Error("Keypair not initialized");
    }

    const now = Math.floor(Date.now() / 1000);

    const header = {
      alg: "SR25519",
      typ: "JWT",
    };

    const payload = {
      sub: this.address,
      publicKey: this.publicKey,
      keyType: "sr25519",
      addressInfo: {
        addressType: "ss58",
        metadata: {
          prefix: 42,
        },
      },
      iat: now,
      exp: now + 3600,
      nonce: randomUUID(),
      _protocol_metadata: {
        version: getCurrentProtocolVersion(),
      },
    };

    const encodedHeader = base64url.default.encode(JSON.stringify(header));
    const encodedPayload = base64url.default.encode(JSON.stringify(payload));

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const message = new TextEncoder().encode(signingInput);

    const signature = sr25519Sign(message, {
      publicKey: this.toUint8Array(this.publicKey),
      secretKey: this.toUint8Array(this.privateKey),
    });

    const encodedSignature = base64url.default.encode(Buffer.from(signature));

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  private toUint8Array(hex: string) {
    return new Uint8Array(Buffer.from(hex, "hex"));
  }

  private toHex(array: Uint8Array<ArrayBufferLike>) {
    return Buffer.from(array).toString("hex");
  }
}
