import {
  cryptoWaitReady,
  encodeAddress,
  mnemonicToMiniSecret,
  sr25519PairFromSeed,
  sr25519Sign,
} from '@polkadot/util-crypto';

const PROTOCOL_VERSION = '1.0.0';

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

  async signRequest(method: string, path: string) {
    await this.initialized;

    if (!this.publicKey || !this.privateKey || !this.address) {
      throw new Error('Keypair not initialized');
    }

    const timestamp = Date.now();
    const requestData = {
      userWalletAddress: this.address,
      userPublicKey: this.publicKey,
      method,
      path,
      timestamp,
      _protocol_metadata: {
        version: PROTOCOL_VERSION,
      },
    };

    const message = new TextEncoder().encode(JSON.stringify(requestData));
    const signature = sr25519Sign(message, {
      publicKey: this.toUint8Array(this.publicKey),
      secretKey: this.toUint8Array(this.privateKey),
    });

    return {
      signature: this.toHex(signature),
      publicKey: this.publicKey,
      walletAddress: this.address,
      timestamp,
    };
  }

  private toUint8Array(hex: string) {
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  private toHex(array: Uint8Array<ArrayBufferLike>) {
    return Buffer.from(array).toString('hex');
  }
}
