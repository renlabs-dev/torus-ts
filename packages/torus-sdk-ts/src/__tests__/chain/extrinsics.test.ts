import { Keyring } from "@polkadot/keyring";
import { if_let } from "rustie";
import { assert, describe, expect, it } from "vitest";

import {
  type ExtrinsicTracker,
  type ExtUpdate,
  type ExtUpdateInBlock,
  submitTxWithTracker,
} from "../../extrinsics.js";
import { getApi } from "../../testing/getApi.js";

/**
 * Live chain tests for submitWithTracker function.
 *
 * Tests the ExtrinsicTracker functionality including event emission,
 * status updates, and proper cleanup.
 */
describe("submitWithTracker - live chain", () => {
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const bob = keyring.addFromUri("//Bob");

  // Account pool for test isolation - FIFO queue
  const testAccounts = [
    keyring.addFromUri("//Alice"),
    keyring.addFromUri("//Bob"),
    keyring.addFromUri("//Charlie"),
    keyring.addFromUri("//Dave"),
    keyring.addFromUri("//Eve"),
    keyring.addFromUri("//Ferdie"),
  ];

  const accountQueue: Array<typeof alice> = [...testAccounts];
  const accountPool = {
    async acquire(): Promise<typeof alice> {
      while (accountQueue.length === 0) {
        // Wait for an account to become available
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return accountQueue.shift()!; // FIFO - take from front
    },

    release(account: typeof alice): void {
      accountQueue.push(account); // FIFO - return to back
    },
  };

  /**
   * Helper to collect all status updates from an ExtrinsicTracker
   */
  async function collectTrackerUpdates(
    tracker: ExtrinsicTracker,
    timeoutMs: number = 20000,
  ): Promise<{
    statusUpdates: ExtUpdate[];
    inBlockUpdate?: ExtUpdate;
    finalUpdate?: ExtUpdate;
  }> {
    const statusUpdates: ExtUpdate[] = [];
    let inBlockUpdate: ExtUpdate | undefined;
    let finalUpdate: ExtUpdate | undefined;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        tracker.cancel();
        reject(new Error(`Transaction timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Listen for all status updates
      tracker.on("status", (update) => {
        statusUpdates.push(update);
      });

      // Listen for specific events
      tracker.on("inBlock", (update) => {
        inBlockUpdate = update;
      });

      tracker.on("internalError", (update) => {
        finalUpdate = update;
        clearTimeout(timeout);
        resolve({ statusUpdates, inBlockUpdate, finalUpdate });
      });

      tracker.on("invalid", (update) => {
        finalUpdate = update;
        clearTimeout(timeout);
        resolve({ statusUpdates, inBlockUpdate, finalUpdate });
      });

      tracker.on("evicted", (update) => {
        finalUpdate = update;
        clearTimeout(timeout);
        resolve({ statusUpdates, inBlockUpdate, finalUpdate });
      });

      tracker.on("finalized", (update) => {
        finalUpdate = update;
        clearTimeout(timeout);
        resolve({ statusUpdates, inBlockUpdate, finalUpdate });
      });

      tracker.on("finalityTimeout", (update) => {
        finalUpdate = update;
        clearTimeout(timeout);
        resolve({ statusUpdates, inBlockUpdate, finalUpdate });
      });

      // For transactions that reach InBlock (success or failure), terminate to avoid waiting for finalization
      tracker.on("inBlock", (update) => {
        if (update.kind === "InBlock") {
          finalUpdate = update;
          clearTimeout(timeout);
          resolve({ statusUpdates, inBlockUpdate, finalUpdate });
        }
      });
    });
  }

  it("successfully tracks system.remark transaction", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test tracker success");

    const account = await accountPool.acquire();

    const tracker = submitTxWithTracker(api, tx, account);

    try {
      const { statusUpdates, inBlockUpdate, finalUpdate } =
        await collectTrackerUpdates(tracker);

      // Should have multiple status updates
      expect(statusUpdates.length).toBeGreaterThan(0);

      // Should have received an inBlock update
      expect(inBlockUpdate).toBeDefined();
      assert(inBlockUpdate);

      // Type guard to ensure it's an InBlock update
      assert(inBlockUpdate.kind === "InBlock");
      const inBlockTyped = inBlockUpdate as ExtUpdateInBlock;

      // Validate inBlock update structure
      expect(inBlockTyped.kind).toBe("InBlock");
      expect(inBlockTyped.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(inBlockTyped.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(inBlockTyped.blockNumber).toBeGreaterThan(0);
      expect(inBlockTyped.txIndex).toBeGreaterThanOrEqual(0);
      expect(inBlockTyped.events).toBeInstanceOf(Array);

      // Check outcome is Success for system.remark
      expect("Success" in inBlockTyped.outcome).toBe(true);

      // Final update should be the inBlock update for successful transactions
      expect(finalUpdate).toBeDefined();
      expect(finalUpdate).toEqual(inBlockUpdate);

      // Validate base fields are consistent across updates
      statusUpdates.forEach((update) => {
        expect(update.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(update.extResultRaw).toBeInstanceOf(Object);
        expect(update.extResult).toBeInstanceOf(Object);
      });
    } finally {
      tracker.cancel();
      accountPool.release(account);
    }
  });

  it("successfully tracks failed transfer with insufficient balance", async () => {
    const api = await getApi();

    const account = await accountPool.acquire();

    // Create a transfer that will fail due to insufficient balance
    // Use BigInt for large numbers then convert to string
    const largeAmount = (1_000_000_000n * 10n ** 18n).toString();
    const tx = api.tx.balances.transferKeepAlive(bob.address, largeAmount);

    const tracker = submitTxWithTracker(api, tx, account);

    try {
      const { statusUpdates, inBlockUpdate, finalUpdate } =
        await collectTrackerUpdates(tracker);

      // Should have multiple status updates
      expect(statusUpdates.length).toBeGreaterThan(0);

      // Should have received an inBlock update even for failed transactions
      expect(inBlockUpdate).toBeDefined();
      assert(inBlockUpdate);

      // Type guard to ensure it's an InBlock update
      assert(inBlockUpdate.kind === "InBlock");
      const inBlockTyped = inBlockUpdate as ExtUpdateInBlock;

      // Validate inBlock update structure
      expect(inBlockTyped.kind).toBe("InBlock");
      expect(inBlockTyped.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(inBlockTyped.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(inBlockTyped.blockNumber).toBeGreaterThan(0);
      expect(inBlockTyped.txIndex).toBeGreaterThanOrEqual(0);
      expect(inBlockTyped.events).toBeInstanceOf(Array);

      // Check outcome is Failed for insufficient balance
      expect("Failed" in inBlockTyped.outcome).toBe(true);

      if_let(inBlockTyped.outcome, "Failed")(
        ({ error, info }) => {
          expect(error).toBeDefined();
          expect(info).toBeDefined();
          expect(info.weight).toBeDefined();
          expect(info.class).toBeDefined();
          expect(info.paysFee).toBeDefined();
        },
        (info) => {
          throw new Error(`Unexpected outcome: ${info}`);
        },
      );

      // Final update should be the inBlock update for failed transactions
      expect(finalUpdate).toBeDefined();
      expect(finalUpdate).toEqual(inBlockUpdate);
    } finally {
      tracker.cancel();
      accountPool.release(account);
    }
  });

  it("properly emits pool status events", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test pool events");

    const account = await accountPool.acquire();

    const tracker = submitTxWithTracker(api, tx, account);

    try {
      // Collect events for a shorter period to catch pool states
      const poolEvents: ExtUpdate[] = [];
      const inBlockEvents: ExtUpdate[] = [];

      tracker.on("inPool", (update) => {
        poolEvents.push(update);
      });

      tracker.on("inBlock", (update) => {
        inBlockEvents.push(update);
      });

      const { statusUpdates } = await collectTrackerUpdates(tracker, 15000);

      // Should have received some status updates
      expect(statusUpdates.length).toBeGreaterThan(0);

      // Pool events might include Ready, Future, or Broadcast states
      if (poolEvents.length > 0) {
        poolEvents.forEach((update) => {
          expect(["Future", "Ready", "Broadcast"]).toContain(update.kind);
          expect(update.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        });
      }

      // Should have at least one inBlock event
      expect(inBlockEvents.length).toBeGreaterThanOrEqual(1);
    } finally {
      tracker.cancel();
      accountPool.release(account);
    }
  });

  it("handles invalid transaction with bad nonce", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test invalid tx");

    const account = await accountPool.acquire();

    // Create transaction with artificially high nonce to trigger invalid transaction
    const currentNonce = await api.rpc.system.accountNextIndex(account.address);
    const badNonce = currentNonce.toNumber() + 1000; // Use a nonce far in the future

    // Use the transaction with bad nonce option
    const tracker = submitTxWithTracker(api, tx, account, { nonce: badNonce });

    try {
      let invalidEventReceived = false;
      let internalErrorReceived = false;

      tracker.on("invalid", (update) => {
        invalidEventReceived = true;
        expect(update.reason).toBeInstanceOf(Error);
        expect(update.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
      });

      tracker.on("internalError", (update) => {
        internalErrorReceived = true;
        expect(update.internalError).toBeInstanceOf(Error);
        expect(update.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
      });

      // For this test, accept Future status as terminal since high nonce won't proceed
      const result = await new Promise<{ statusUpdates: ExtUpdate[] }>(
        (resolve, reject) => {
          const statusUpdates: ExtUpdate[] = [];
          const timeout = setTimeout(() => {
            tracker.cancel();
            resolve({ statusUpdates }); // Don't reject, just return what we have
          }, 5000);

          tracker.on("status", (update) => {
            statusUpdates.push(update);
            // If we see Future status, that's enough for this test
            if (update.kind === "Future") {
              clearTimeout(timeout);
              resolve({ statusUpdates });
            }
          });

          tracker.on("invalid", () => {
            clearTimeout(timeout);
            resolve({ statusUpdates });
          });

          tracker.on("internalError", () => {
            clearTimeout(timeout);
            resolve({ statusUpdates });
          });
        },
      );

      const { statusUpdates } = result;

      // Should have received some status updates
      expect(statusUpdates.length).toBeGreaterThan(0);

      // For high nonce transactions, they go to Future state but won't proceed
      // Check that we got some status updates indicating the transaction was processed
      const hasFutureStatus = statusUpdates.some(
        (update) => update.kind === "Future",
      );

      // Either we get invalid/internal error events, or the transaction goes to Future status
      expect(
        invalidEventReceived || internalErrorReceived || hasFutureStatus,
      ).toBe(true);
    } finally {
      tracker.cancel();
      accountPool.release(account);
    }
  });

  it("properly cancels and cleans up resources", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test cancellation");

    const account = await accountPool.acquire();

    const tracker = submitTxWithTracker(api, tx, account);

    // Cancel immediately
    tracker.cancel();

    // Verify emitter is cleaned up
    expect(tracker.emitter.listenerCount()).toBe(0);

    // Should be able to call cancel multiple times without error
    tracker.cancel();
    tracker.cancel();

    // Release account after cancellation test
    accountPool.release(account);
  });

  it("validates event structure and data consistency", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test event validation");

    const account = await accountPool.acquire();

    const tracker = submitTxWithTracker(api, tx, account);

    try {
      const { statusUpdates, inBlockUpdate } =
        await collectTrackerUpdates(tracker);

      // Validate that all status updates have required base fields
      statusUpdates.forEach((update, index) => {
        expect(update.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(update.extResultRaw).toBeDefined();
        expect(update.extResult).toBeDefined();

        // All updates should have the same txHash
        if (index > 0) {
          expect(update.txHash).toBe(statusUpdates[0]!.txHash);
        }
      });

      // Validate inBlock update has all required fields for successful transaction
      if (inBlockUpdate && inBlockUpdate.kind === "InBlock") {
        const inBlockTyped = inBlockUpdate as ExtUpdateInBlock;
        expect(inBlockTyped.kind).toBe("InBlock");
        expect(inBlockTyped.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(inBlockTyped.blockNumber).toBeGreaterThan(0);
        expect(inBlockTyped.txIndex).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(inBlockTyped.events)).toBe(true);

        // Validate outcome structure
        expect(
          "Success" in inBlockTyped.outcome || "Failed" in inBlockTyped.outcome,
        ).toBe(true);

        // Validate events structure if present
        inBlockTyped.events.forEach((event) => {
          expect(event.phase).toBeDefined();
          expect(event.event).toBeDefined();
          expect(event.topics).toBeDefined();
          expect(Array.isArray(event.topics)).toBe(true);
        });
      }
    } finally {
      tracker.cancel();
      accountPool.release(account);
    }
  });
});
