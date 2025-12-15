/**
 * Example: Make a transfer and retrieve txHash and blockHash
 */

import { Keyring } from "@polkadot/keyring";
import type { ISubmittableResult } from "@polkadot/types/types";
import { transferKeepAlive } from "@torus-network/sdk/chain";
import { checkSS58 } from "@torus-network/sdk/types";
import { connectToChainRpc } from "@torus-network/sdk/utils";

async function main() {
  const RPC_URL = "wss://api.testnet.torus.network";
  const SENDER_MNEMONIC = "";
  const RECIPIENT_ADDRESS = "5DJBFtDLxZ3cahV2zdUzbe5xJiZRqbJdRCdU3WL6txZNqBBj";
  const AMOUNT = 1n * 10n ** 18n;

  const api = await connectToChainRpc(RPC_URL);
  const keyring = new Keyring({ type: "sr25519" });
  const sender = keyring.addFromMnemonic(SENDER_MNEMONIC);
  const recipientAddress = checkSS58(RECIPIENT_ADDRESS);
  const transferTx = transferKeepAlive(api, recipientAddress, AMOUNT);

  const result = await new Promise<{
    txHash: string;
    blockHash: string;
  }>((resolve, reject) => {
    transferTx
      .signAndSend(sender, ({ status, dispatchError }: ISubmittableResult) => {
        console.log(`Status: ${status.type}`);

        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(
              new Error(
                `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`,
              ),
            );
          } else {
            reject(new Error(dispatchError.toString()));
          }
          return;
        }

        if (status.isFinalized) {
          const txHash = transferTx.hash.toHex();
          const blockHash = status.asFinalized.toHex();
          resolve({ txHash, blockHash });
        }
      })
      .catch((error: unknown) => {
        reject(new Error(`Failed to submit transaction: ${String(error)}`));
      });
  });

  console.log(JSON.stringify(result, null, 2));
  await api.disconnect();
}

main().catch((error: unknown) => {
  console.error("Error:", error);
  process.exit(1);
});
