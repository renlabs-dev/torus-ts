import type { ApiPromise } from "@polkadot/api";
import type { VoidFn } from "@polkadot/api/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import type { Api } from "@torus-network/sdk/chain";
import { queryLastBlock } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { faucetWorkerCode } from "./faucet-worker-code";

interface WorkResult {
  hash: Uint8Array;
  nonce: Uint8Array;
  block: number;
}

class MultiWorkerManager {
  private workers: Worker[] = [];
  private workerCount: number;
  private decodedAddress: Uint8Array;
  private currentBlockData: { blockHash: Uint8Array; blockNumber: number };
  private onFound: (result: WorkResult) => Promise<void> | void;
  private onError?: (err: ErrorEvent) => Promise<void> | void;
  private found = false;
  private workerBlobUrl: string;

  constructor(
    workerCount: number,
    decodedAddress: Uint8Array,
    initialBlockData: { blockHash: Uint8Array; blockNumber: number },
    onFound: (result: WorkResult) => Promise<void> | void,
    onError?: (err: ErrorEvent) => Promise<void> | void,
  ) {
    this.workerCount = workerCount;
    this.decodedAddress = decodedAddress;
    this.currentBlockData = initialBlockData;
    this.onFound = onFound;
    this.onError = onError;

    // Create blob URL for worker code
    const blob = new Blob([faucetWorkerCode], {
      type: "application/javascript",
    });
    this.workerBlobUrl = URL.createObjectURL(blob);
  }

  start() {
    this.found = false;
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new window.Worker(this.workerBlobUrl);

      worker.onmessage = async (e) => {
        if (this.found) return; // already found, ignore

        this.found = true;
        const { nonce, hash, blockNumber } = e.data as {
          nonce: Buffer;
          hash: Buffer;
          blockNumber: number;
        };

        this.terminateAll();
        await this.onFound({
          nonce: new Uint8Array(nonce),
          hash: new Uint8Array(hash),
          block: blockNumber,
        });
      };

      worker.onerror = async (err) => {
        if (this.onError) await this.onError(err);
      };

      worker.postMessage({
        type: "start",
        blockData: {
          blockHash: Array.from(this.currentBlockData.blockHash),
          blockNumber: this.currentBlockData.blockNumber,
        },
        decodedAddress: Array.from(this.decodedAddress),
      });

      this.workers.push(worker);
    }
  }

  updateBlock(newBlockData: { blockHash: Uint8Array; blockNumber: number }) {
    this.currentBlockData = newBlockData;
    this.found = false;

    for (const worker of this.workers) {
      worker.postMessage({
        type: "updateBlock",
        blockData: {
          blockHash: Array.from(newBlockData.blockHash),
          blockNumber: newBlockData.blockNumber,
        },
      });
    }
  }

  terminateAll() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];

    // Clean up blob URL
    if (this.workerBlobUrl) {
      URL.revokeObjectURL(this.workerBlobUrl);
    }
  }
}

export function doWork(
  api: Api & ApiPromise,
  address: string,
  onCleanup?: (cleanup: () => void) => void,
): Promise<WorkResult> {
  return new Promise((resolve, _reject) => {
    let unsubscribe: VoidFn | undefined;
    let manager: MultiWorkerManager | undefined;

    const cleanup = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }
      if (manager) {
        manager.terminateAll();
        manager = undefined;
      }
    };

    void (async () => {
      const [blockError, currentBlockData] = await tryAsync(
        queryLastBlock(api),
      );
      if (blockError !== undefined) {
        cleanup();
        throw new Error(`Failed to query last block: ${blockError.message}`);
      }

      const [decodeError, decodedAddress] = await tryAsync(
        Promise.resolve(decodeAddress(address)),
      );

      if (decodeError !== undefined) {
        cleanup();
        throw new Error(
          `Failed to decode address: ${decodeError instanceof Error ? decodeError.message : "Invalid address"}`,
        );
      }

      const onFound = (workResult: WorkResult) => {
        cleanup();
        resolve(workResult);
      };

      const workerCount = navigator.hardwareConcurrency || 4;
      console.log(`Executing with ${workerCount} workers.`);

      manager = new MultiWorkerManager(
        workerCount,
        decodedAddress,
        currentBlockData,
        onFound,
      );

      // Provide cleanup function to parent component
      if (onCleanup) {
        onCleanup(cleanup);
      }

      manager.start();

      const [subscriptionError, subscription] = await tryAsync(
        api.rpc.chain.subscribeNewHeads((head) => {
          if (manager) {
            manager.updateBlock({
              blockHash: head.hash,
              blockNumber: head.number.toNumber(),
            });
          }
        }),
      );

      if (subscriptionError !== undefined) {
        cleanup();
        throw new Error(
          `Failed to subscribe to new blocks: ${subscriptionError.message}`,
        );
      }

      unsubscribe = subscription;
    })();
  });
}

export function callFaucetExtrinsic(
  api: Api & ApiPromise,
  workResult: WorkResult,
  address: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const call = api.tx.faucet!.faucet!(
        workResult.block,
        workResult.nonce,
        // ! Had to send this as a hex 'cause when it was being sent as a Uint8Array the chain was getting an empty vec.
        u8aToHex(workResult.hash),
        address,
      );

      const [sendError, unsubscribe] = await tryAsync(
        call.send((result) => {
          if (result.status.isInBlock) {
            const blockHash = result.status.asInBlock.toHex();
            console.log("Included in block hash", blockHash);

            // Update progress message for user
            if (onProgress) {
              onProgress(`Included in block ${smallAddress(blockHash)}`);
            }
          } else if (result.status.isFinalized) {
            console.log(
              "Finalized block hash",
              result.status.asFinalized.toHex(),
            );

            result.events.forEach(({ event: { method, section, data } }) => {
              if (section === "system" && method === "ExtrinsicFailed") {
                const [dispatchError] = data as unknown as [DispatchError];

                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(
                    dispatchError.asModule,
                  );
                  const { section, name, docs } = decoded;
                  console.error(
                    `❌ Error: ${section}.${name} - ${docs.join(" ")}`,
                  );
                } else {
                  console.error("❌ Error:", dispatchError.toString());
                }

                reject(new Error("Transaction failed."));
              } else if (
                section === "system" &&
                method === "ExtrinsicSuccess"
              ) {
                resolve();
                console.log("✅ Transaction successful");
              }
            });

            if (unsubscribe) {
              unsubscribe();
            }
          }
        }),
      );

      if (sendError !== undefined) {
        reject(new Error(`Failed to send transaction: ${sendError.message}`));
      }
    })();
  });
}
