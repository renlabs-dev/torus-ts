import { z } from "zod";

export type FirstFaucetRequestData = z.infer<typeof FirstFaucetRequestDataScheme>;

export const FirstFaucetRequestDataScheme = z.object({
    recipient: z.string(),
    block: z.number(),
    nonce: z.string().transform(val => BigInt(val)),
    hash: z.string(),
    token: z.string()
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
  private onFound: (result: WorkResult) => void;
  private onError?: (err: ErrorEvent) => void;
  private found = false;

  constructor(
    workerCount: number,
    decodedAddress: Uint8Array,
    initialBlockData: { blockHash: Uint8Array; blockNumber: number },
    onFound: (result: WorkResult) => Promise<void>,
    onError?: (err: ErrorEvent) => void
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
      const worker = new Worker('/faucetWorker.js');

      worker.onmessage = (e) => {
        if (this.found) return; // already found, ignore

        this.found = true;
        const { nonce, hash, blockNumber } = e.data;

        this.terminateAll();
        this.onFound({
          nonce: new Uint8Array(nonce),
          hash: new Uint8Array(hash),
          block: blockNumber,
        });
      };

      worker.onerror = (err) => {
        if (this.onError) this.onError(err);
      };

      worker.postMessage({
        type: 'start',
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
        type: 'updateBlock',
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