import type { ApiPromise } from "@polkadot/api";
import type { VoidFn } from "@polkadot/api/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import { queryLastBlock } from "@torus-network/sdk/chain";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { assert } from "tsafe";

interface WorkResult {
  hash: Uint8Array;
  nonce: Uint8Array;
  block: number;
}

/**
 * Error thrown when the faucet work block is too old or in the future.
 * This is a recoverable error that should trigger a retry with a fresh block.
 */
export class InvalidWorkBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWorkBlockError";
  }
}

interface BlockData {
  blockHash: Uint8Array;
  blockNumber: number;
}

interface WorkerMessageData {
  nonce: Buffer;
  hash: Buffer;
  blockNumber: number;
}

class MultiWorkerManager {
  private readonly workers: Worker[] = [];
  private readonly workerCount: number;
  private readonly decodedAddress: Uint8Array;
  private readonly onFound: (result: WorkResult) => Promise<void> | void;
  private readonly onError?: (err: ErrorEvent) => Promise<void> | void;
  private currentBlockData: BlockData;
  private found = false;

  constructor(
    workerCount: number,
    decodedAddress: Uint8Array,
    initialBlockData: BlockData,
    onFound: (result: WorkResult) => Promise<void> | void,
    onError?: (err: ErrorEvent) => Promise<void> | void,
  ) {
    this.workerCount = workerCount;
    this.decodedAddress = decodedAddress;
    this.currentBlockData = initialBlockData;
    this.onFound = onFound;
    this.onError = onError;
  }

  start() {
    this.found = false;

    for (let i = 0; i < this.workerCount; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
    }
  }

  private createWorker(): Worker {
    // TODO: check if we can inject the faucet worker code from the bundler
    // instead of using a static file
    const worker = new window.Worker("/faucetWorker.js");

    worker.onmessage = async (e) => {
      if (this.found) return;

      this.found = true;
      const data = e.data as WorkerMessageData;

      this.terminateAll();
      await this.onFound({
        nonce: new Uint8Array(data.nonce),
        hash: new Uint8Array(data.hash),
        block: data.blockNumber,
      });
    };

    worker.onerror = async (err) => {
      if (!this.onError) return;
      this.terminateAll();
      await this.onError(err);
    };

    worker.postMessage({
      type: "start",
      blockData: {
        blockHash: Array.from(this.currentBlockData.blockHash),
        blockNumber: this.currentBlockData.blockNumber,
      },
      decodedAddress: Array.from(this.decodedAddress),
    });

    return worker;
  }

  updateBlock(newBlockData: BlockData) {
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
    this.workers.length = 0;
  }
}

const DEFAULT_WORKER_COUNT = 4;

function getWorkerCount(): number {
  return navigator.hardwareConcurrency || DEFAULT_WORKER_COUNT;
}

function createUnsubscribeHandler(unsubscribe: VoidFn | undefined): () => void {
  return () => {
    if (!unsubscribe) return;
    unsubscribe();
  };
}

export function doWork(api: ApiPromise, address: string): Promise<WorkResult> {
  return new Promise((resolve, reject) => {
    let unsubscribe: VoidFn | undefined;
    let manager: MultiWorkerManager | undefined;

    const cleanup = () => {
      createUnsubscribeHandler(unsubscribe)();
      if (manager) {
        manager.terminateAll();
      }
    };

    void (async () => {
      const [blockError, currentBlockData] = await tryAsync(
        queryLastBlock(api),
      );
      if (blockError !== undefined) {
        cleanup();
        reject(new Error(`Failed to query block: ${blockError.message}`));
        return;
      }

      const decodedAddress = decodeAddress(address);
      const workerCount = getWorkerCount();

      console.log(`Executing with ${workerCount} workers.`);

      const onFound = (workResult: WorkResult) => {
        cleanup();
        resolve(workResult);
      };

      const onError = (err: ErrorEvent) => {
        cleanup();
        reject(new Error(`Worker error: ${err.message}`));
      };

      manager = new MultiWorkerManager(
        workerCount,
        decodedAddress,
        currentBlockData,
        onFound,
        onError,
      );

      manager.start();

      const [subscribeError, subscription] = await tryAsync(
        api.rpc.chain.subscribeNewHeads((head) => {
          assert(
            manager !== undefined,
            "Manager should be defined when subscription callback is invoked",
          );
          manager.updateBlock({
            blockHash: head.hash,
            blockNumber: head.number.toNumber(),
          });
        }),
      );

      if (subscribeError !== undefined) {
        cleanup();
        reject(
          new Error(`Failed to subscribe to blocks: ${subscribeError.message}`),
        );
        return;
      }

      unsubscribe = subscription;
    })();
  });
}

function handleModuleError(
  api: ApiPromise,
  dispatchError: DispatchError,
): Error {
  const decoded = api.registry.findMetaError(dispatchError.asModule);
  const errorMessage = `${decoded.section}.${decoded.name} - ${decoded.docs.join(" ")}`;

  if (decoded.section === "faucet" && decoded.name === "InvalidWorkBlock") {
    return new InvalidWorkBlockError(errorMessage);
  }

  console.error(`Error: ${errorMessage}`);
  return new Error("Transaction Failed.");
}

function handleDispatchError(
  api: ApiPromise,
  dispatchError: DispatchError,
): Error {
  if (dispatchError.isModule) {
    return handleModuleError(api, dispatchError);
  }

  const errorMessage = dispatchError.toString();
  console.error("Error:", errorMessage);
  return new Error("Transaction Failed.");
}

function handleExtrinsicFailed(
  api: ApiPromise,
  data: unknown,
  reject: (error: Error) => void,
  unsubscribe: VoidFn,
): void {
  const [dispatchError] = data as [DispatchError];
  const error = handleDispatchError(api, dispatchError);
  unsubscribe();
  reject(error);
}

function handleExtrinsicSuccess(
  resolve: () => void,
  unsubscribe: VoidFn,
): void {
  console.log("Transaction succeeded");
  unsubscribe();
  resolve();
}

export function callFaucetExtrinsic(
  api: ApiPromise,
  workResult: WorkResult,
  address: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    void (async () => {
      const call = api.tx.faucet?.faucet?.(
        workResult.block,
        workResult.nonce,
        u8aToHex(workResult.hash),
        address,
      );

      if (!call) {
        reject(new Error("Faucet extrinsic not available"));
        return;
      }

      const [sendError, unsubscribe] = await tryAsync(
        call.send((result) => {
          if (result.status.isInBlock) {
            console.log(
              "Included at block hash",
              result.status.asInBlock.toHex(),
            );
            return;
          }

          if (!result.status.isFinalized) return;

          console.log(
            "Finalized block hash",
            result.status.asFinalized.toHex(),
          );

          for (const {
            event: { method, section, data },
          } of result.events) {
            if (section === "system" && method === "ExtrinsicFailed") {
              assert(
                unsubscribe !== undefined,
                "Unsubscribe should be defined when handling extrinsic failed",
              );
              handleExtrinsicFailed(api, data, reject, unsubscribe);
              break;
            }

            if (section === "system" && method === "ExtrinsicSuccess") {
              assert(
                unsubscribe !== undefined,
                "Unsubscribe should be defined when handling extrinsic success",
              );
              handleExtrinsicSuccess(resolve, unsubscribe);
              break;
            }
          }
        }),
      );

      if (sendError !== undefined) {
        reject(
          new Error(`Failed to send faucet extrinsic: ${sendError.message}`),
        );
        return;
      }
    })();
  });
}
