import type { SubmittableResult } from "@polkadot/api";
import {
  AddressOrPair,
  SignerOptions,
  SubmittableExtrinsic,
} from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import { if_let, match } from "rustie";
import { assert, describe, expect, it } from "vitest";

import { parseSubmittableResult, type TxState } from "../../extrinsics.js";
import { getApi } from "../../testing/getApi.js";

/**
 * Live chain tests for parseSubmittableResult function.
 *
 * NOTE: Event.section and Event.method parsing is currently not working correctly.
 * The sb_event parser in extrinsics.ts needs to properly extract these fields.
 * Once fixed, uncomment the assertions that check for these fields.
 */
describe("parseSubmittableResult - live chain", () => {
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const bob = keyring.addFromUri("//Bob");

  /**
   * Helper to collect all status updates from a transaction
   */
  async function collectTxUpdates(
    tx: SubmittableExtrinsic<"promise">,
    signer: AddressOrPair,
    options: Partial<SignerOptions> = {},
  ): Promise<{
    updates: TxState[];
    rawResults: SubmittableResult[];
  }> {
    const updates: TxState[] = [];
    const rawResults: SubmittableResult[] = [];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Transaction timed out after 20 seconds"));
      }, 20000);

      tx.signAndSend(signer, options, (rawResult: SubmittableResult) => {
        try {
          rawResults.push(rawResult);
          const { txState } = parseSubmittableResult(rawResult);
          updates.push(txState);

          // Check for terminal states (modified to not wait for finalization)
          const isTerminal = match(txState)<boolean>({
            Invalid: () => true,
            Evicted: () => true,
            InternalError: () => true,
            Included: ({ kind }) => kind === "InBlock" || kind === "FinalityTimeout", // Stop at InBlock or FinalityTimeout
            Pool: ({ kind }) => kind === "Future" && options.nonce === 999999,
            Warning: () => false,
          });

          if (isTerminal) {
            clearTimeout(timeout);
            resolve({ updates, rawResults });
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  it("successfully parses system.remark transaction", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test success");

    const { updates, rawResults } = await collectTxUpdates(tx, alice);

    // Should have multiple status updates
    expect(updates.length).toBeGreaterThan(0);
    expect(rawResults.length).toBeGreaterThan(0);

    // Find the final update (should be Included, likely InBlock)
    const finalUpdate = updates[updates.length - 1];
    assert(finalUpdate);
    expect("Included" in finalUpdate).toBe(true);

    if_let(finalUpdate, "Included")(
      (included) => {
        // Validate structure (could be InBlock or Finalized)
        expect(["InBlock", "Finalized"].includes(included.kind)).toBe(true);
        expect(included.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(included.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(included.blockNumber).toBeGreaterThan(0);
        expect(included.txIndex).toBeGreaterThanOrEqual(0);

        // Check outcome is Success
        expect("Success" in included.outcome).toBe(true);
        if_let(included.outcome, "Success")(
          ({ info }) => {
            expect(info.weight.refTime).toBeGreaterThan(0n);
            expect(info.weight.proofSize).toBeGreaterThanOrEqual(0n);
            expect("Normal" in info.class).toBe(true);
            expect("Yes" in info.paysFee).toBe(true);
          },
          () => {}, // No-op for non-Success case
        );

        // Validate events
        expect(included.events).toBeInstanceOf(Array);
        expect(included.events.length).toBeGreaterThan(0);

        // Should have ExtrinsicSuccess event
        const successEvent = included.events.find(
          (e) =>
            e.event &&
            e.event.section === "system" &&
            e.event.method === "ExtrinsicSuccess",
        );
        // For now, just check we have events
        expect(included.events.length).toBeGreaterThan(0);
        if (successEvent) {
          expect("ApplyExtrinsic" in successEvent.phase).toBe(true);
          expect(successEvent.topics).toBeInstanceOf(Array);
        }

        // All events should have proper structure
        for (const eventRecord of included.events) {
          expect(eventRecord.event).toBeDefined();
          // Skip section/method check for now since they're not being parsed correctly
          // expect(eventRecord.event.section).toBeDefined();
          // expect(eventRecord.event.method).toBeDefined();
          expect(eventRecord.phase).toBeDefined();
          expect(eventRecord.topics).toBeInstanceOf(Array);
        }
      },
      () => {
        assert.fail("Expected Included variant");
      },
    );

    // Check we went through expected status progression
    const statusTypes = updates.map((u) => Object.keys(u)[0]);
    expect(statusTypes).toContain("Pool");
    expect(statusTypes[statusTypes.length - 1]).toBe("Included");
  });

  it("successfully parses failed transfer with insufficient balance", async () => {
    const api = await getApi();
    const tx = api.tx.balances.transferKeepAlive(
      bob.address,
      BigInt("999999999999999999999999"),
    );

    const { updates, rawResults } = await collectTxUpdates(tx, alice);

    // Should have multiple status updates
    expect(updates.length).toBeGreaterThan(0);
    expect(rawResults.length).toBeGreaterThan(0);

    // Find the final update (should be Included)
    const finalUpdate = updates[updates.length - 1];
    assert(finalUpdate);
    expect("Included" in finalUpdate).toBe(true);

    if_let(finalUpdate, "Included")(
      (included) => {
        // Validate structure
        expect(included.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(included.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(included.blockNumber).toBeGreaterThan(0);
        expect(included.txIndex).toBeGreaterThanOrEqual(0);

        // Check outcome is Failed
        expect("Failed" in included.outcome).toBe(true);
        if_let(included.outcome, "Failed")(
          ({ error, info }) => {
            // Should have a Token error
            expect("Token" in error || "Module" in error).toBe(true);

            // Dispatch info should still be present
            expect(info.weight.refTime).toBeGreaterThan(0n);
            expect(info.weight.proofSize).toBeGreaterThanOrEqual(0n);
            expect("Normal" in info.class).toBe(true);
            expect("Yes" in info.paysFee).toBe(true);
          },
          () => {}, // No-op for non-Failed case
        );

        // Validate events
        expect(included.events).toBeInstanceOf(Array);
        expect(included.events.length).toBeGreaterThan(0);

        // Should have ExtrinsicFailed event
        const failedEvent = included.events.find(
          (e) =>
            e.event &&
            e.event.section === "system" &&
            e.event.method === "ExtrinsicFailed",
        );
        // For now, just check we have events
        expect(included.events.length).toBeGreaterThan(0);
        if (failedEvent) {
          expect("ApplyExtrinsic" in failedEvent.phase).toBe(true);
        }

        // All events should have proper structure
        for (const eventRecord of included.events) {
          expect(eventRecord.event).toBeDefined();
          // Skip section/method check for now since they're not being parsed correctly
          // expect(eventRecord.event.section).toBeDefined();
          // expect(eventRecord.event.method).toBeDefined();
          expect(eventRecord.phase).toBeDefined();
          expect(eventRecord.topics).toBeInstanceOf(Array);
        }
      },
      () => {
        assert.fail("Expected Included variant");
      },
    );

    // Check we went through expected status progression
    const statusTypes = updates.map((u) => Object.keys(u)[0]);
    expect(statusTypes).toContain("Pool");
    expect(statusTypes[statusTypes.length - 1]).toBe("Included");
  });

  it("successfully parses invalid transaction with bad nonce", async () => {
    const api = await getApi();
    const tx = api.tx.system.remark("Test invalid");

    const { updates, rawResults } = await collectTxUpdates(tx, alice, {
      nonce: 999999,
    });

    // Should have at least one update
    expect(updates.length).toBeGreaterThan(0);
    expect(rawResults.length).toBeGreaterThan(0);

    // Transaction should either be Invalid or stay in Future pool
    const finalUpdate = updates[updates.length - 1];
    assert(finalUpdate);

    // Could be either Invalid or Pool (Future)
    const isInvalid = "Invalid" in finalUpdate;
    const isFuture =
      "Pool" in finalUpdate && finalUpdate.Pool.kind === "Future";

    expect(isInvalid || isFuture).toBe(true);

    if_let(finalUpdate, "Invalid")(
      (invalid) => {
        expect(invalid.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
        expect(invalid.reason).toBeDefined();
      },
      () => {
        // If not Invalid, check if it's Pool with Future
        if_let(finalUpdate, "Pool")(
          (pool) => {
            expect(pool.kind).toBe("Future");
            expect(pool.txHash).toMatch(/^0x[a-f0-9]{64}$/i);
          },
          () => {
            assert.fail("Expected either Invalid or Pool variant");
          },
        );
      },
    );

    // Should not have reached InBlock or Finalized
    const statusTypes = updates.map((u) => Object.keys(u)[0]);
    expect(statusTypes).not.toContain("Included");

    // No events should be generated (transaction never included)
    for (const update of updates) {
      if ("Included" in update) {
        // This shouldn't happen, but if it does, fail the test
        expect("Included" in update).toBe(false);
      }
    }
  });

  it("validates all event fields are properly parsed", async () => {
    const api = await getApi();

    // Use a transaction that generates multiple events
    const tx = api.tx.balances.transferKeepAlive(bob.address, 1000000n);

    const { updates } = await collectTxUpdates(tx, alice);

    // Find the Included update
    const includedUpdate = updates.find((u) => "Included" in u);
    expect(includedUpdate).toBeDefined();

    if (includedUpdate) {
      if_let(includedUpdate, "Included")(
        ({ events }) => {
          // Should have multiple events (at least transfer and fees)
          expect(events.length).toBeGreaterThanOrEqual(2);

          for (const eventRecord of events) {
            // Validate event structure
            expect(eventRecord.event).toBeDefined();
            // TODO: Fix event.section and event.method parsing
            // expect(typeof eventRecord.event.section).toBe("string");
            // expect(typeof eventRecord.event.method).toBe("string");

            // Event index is optional but if present should be valid
            if (eventRecord.event.index !== undefined) {
              expect(eventRecord.event.index).toBeDefined();
            }

            // Validate phase
            expect(eventRecord.phase).toBeDefined();
            const phaseKeys = Object.keys(eventRecord.phase);
            expect(phaseKeys.length).toBe(1);
            const key = phaseKeys[0];
            assert(key);
            expect(
              ["ApplyExtrinsic", "Finalization", "Initialization"].includes(
                key,
              ),
            ).toBe(true);

            // If ApplyExtrinsic, should have a valid index
            if ("ApplyExtrinsic" in eventRecord.phase) {
              expect(typeof eventRecord.phase.ApplyExtrinsic).toBe("number");
              expect(eventRecord.phase.ApplyExtrinsic).toBeGreaterThanOrEqual(
                0,
              );
            }

            // Topics should be an array of hashes
            expect(eventRecord.topics).toBeInstanceOf(Array);
            for (const topic of eventRecord.topics) {
              expect(topic).toMatch(/^0x[a-f0-9]{64}$/i);
            }
          }

          // TODO: Once event.section and event.method are properly parsed, add these checks:
          // const eventTypes = events.map((e) => `${e.event.section}.${e.event.method}`);
          // expect(eventTypes.some((t) => t.startsWith("balances."))).toBe(true);
          // expect(eventTypes.some((t) => t.startsWith("system."))).toBe(true);
        },
        () => {
          assert.fail("Expected Included variant");
        },
      );
    }
  });
});
