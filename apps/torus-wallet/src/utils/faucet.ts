import type { ApiPromise } from "@polkadot/api";
import type { VoidFn } from "@polkadot/api/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import { queryLastBlock } from "@torus-network/sdk";
import { z } from "zod";

export type FirstFaucetRequestData = z.infer<
  typeof FirstFaucetRequestDataScheme
>;

export const FirstFaucetRequestDataScheme = z.object({
  recipient: z.string(),
  block: z.number(),
  nonce: z.string().transform((val) => BigInt(val)),
  hash: z.string(),
  token: z.string(),
});

export interface WorkResult {
  hash: Uint8Array;
  nonce: Uint8Array;
  block: number;
}

export function u256FromBytes(bytes: Uint8Array): bigint {
  let result = 0n;
  const len = bytes.length;

  for (let i = 0; i < len; i++) {
    const byte = bytes[i];
    if (byte === undefined) {
      throw new Error("Byte array contained undefined value");
    }

    result += BigInt(byte) << (8n * BigInt(len - 1 - i)); // Big-endian
  }

  return result;
}

export class MultiWorkerManager {
  private workers: Worker[] = [];
  private workerCount: number;
  private decodedAddress: Uint8Array;
  private currentBlockData: { blockHash: Uint8Array; blockNumber: number };
  private onFound: (result: WorkResult) => Promise<void> | void;
  private onError?: (err: ErrorEvent) => Promise<void> | void;
  private found = false;

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
  }

  start() {
    this.found = false;
    for (let i = 0; i < this.workerCount; i++) {
      // TODO: check if we can inject the faucet worker code from the bundler
      // instead of using a static file
      const worker = new window.Worker("/faucetWorker.js");

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
  }
}

export function doWork(api: ApiPromise, address: string): Promise<WorkResult> {
  return new Promise((resolve, _reject) => {
    let unsubscribe: VoidFn | undefined;

    void (async () => {
      try {
        const currentBlockData = await queryLastBlock(api);
        const decodedAddress = decodeAddress(address);

        const onFound = (workResult: WorkResult) => {
          if (unsubscribe) {
            unsubscribe();
          }
          resolve(workResult);
        };

        const workerCount = navigator.hardwareConcurrency || 4;

        console.log(`Executing with ${workerCount} workers.`);

        const manager = new MultiWorkerManager(
          workerCount,
          decodedAddress,
          currentBlockData,
          onFound,
        );

        manager.start();

        unsubscribe = await api.rpc.chain.subscribeNewHeads((head) => {
          manager.updateBlock({
            blockHash: head.hash,
            blockNumber: head.number.toNumber(),
          });
        });
      } finally {
        if (unsubscribe) {
          unsubscribe();
        }
      }
    })();
  });
}

export function callFaucetExtrinsic(
  api: ApiPromise,
  workResult: WorkResult,
  address: string,
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

      const unsubscribe = await call.send((result) => {
        if (result.status.isInBlock) {
          console.log(
            "Included at block hash",
            result.status.asInBlock.toHex(),
          );
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

              reject(new Error("Transaction Failed."));
            } else if (section === "system" && method === "ExtrinsicSuccess") {
              resolve();
              console.log("✅ Transaction succeeded");
            }
          });

          unsubscribe();
        }
      });
    })();
  });
}
