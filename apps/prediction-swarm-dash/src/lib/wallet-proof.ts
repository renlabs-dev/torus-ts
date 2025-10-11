import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { u8aToHex } from "@polkadot/util";

export class WalletProof {
  private keyring: Keyring;
  private keypair: KeyringPair;

  constructor(walletSeedPhrase: string) {
    this.keyring = new Keyring({ type: "sr25519" });
    this.keypair = this.keyring.addFromUri(walletSeedPhrase);
  }

  getAddressSS58(): string {
    return this.keypair.address;
  }

  signMessage(message: string): string {
    const signature = this.keypair.sign(message);
    return u8aToHex(signature).slice(2);
  }
}
