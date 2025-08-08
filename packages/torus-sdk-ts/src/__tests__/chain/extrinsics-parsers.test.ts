import { Keyring } from "@polkadot/keyring";
import { describe, expect, it } from "vitest";

import {
  sb_dispatch_error,
  sb_dispatch_info,
  sb_extrinsic_status,
} from "../../extrinsics.js";
import { getApi } from "../../testing/getApi.js";

describe("extrinsics parsers - live chain", () => {
  it("parses successful remark transaction", async () => {
    const api = await getApi();

    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");

    const remarkTx = api.tx.system.remark("Test parser");

    const statusUpdates: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      remarkTx
        .signAndSend(alice, (result) => {
          // Parse the status
          const parsedStatus = sb_extrinsic_status.safeParse(result.status);
          expect(parsedStatus.success).toBe(true);

          if (parsedStatus.success) {
            statusUpdates.push(parsedStatus.data);
          }

          // When transaction is in block, check dispatch info
          if (result.status.isInBlock && result.dispatchInfo) {
            const parsedInfo = sb_dispatch_info.safeParse(result.dispatchInfo);
            expect(parsedInfo.success).toBe(true);

            if (parsedInfo.success) {
              expect(parsedInfo.data.weight.refTime).toBeGreaterThan(0n);
              expect(parsedInfo.data.paysFee).toBeDefined();
            }
          }

          if (result.status.isFinalized) {
            resolve();
          }
        })
        .catch(reject);
    });

    // Verify we got the expected status transitions
    const statusTypes = statusUpdates.map((s: any) => Object.keys(s)[0]);
    expect(statusTypes).toContain("Ready");
    expect(statusTypes).toContain("InBlock");
  });

  it("parses failed transaction with dispatch error", async () => {
    const api = await getApi();
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");

    // Try to set storage without root permission (will fail with BadOrigin)
    const failingTx = api.tx.system.setStorage([["0x1234", "0x5678"]]);

    let dispatchErrorParsed: any = null;

    await new Promise<void>((resolve, reject) => {
      failingTx
        .signAndSend(alice, (result) => {
          // When we get dispatch error, parse it
          if (result.dispatchError) {
            const parsed = sb_dispatch_error.safeParse(result.dispatchError);
            expect(parsed.success).toBe(true);

            if (parsed.success) {
              dispatchErrorParsed = parsed.data;
            }
          }

          if (result.status.isFinalized || result.status.isInBlock) {
            resolve();
          }
        })
        .catch(reject);
    });

    // Verify we got BadOrigin error
    expect(dispatchErrorParsed).toBeDefined();
    expect(dispatchErrorParsed).toEqual({ BadOrigin: null });
  });

  it("tracks all status transitions", async () => {
    const api = await getApi();
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");

    const tx = api.tx.system.remark("Track status transitions");
    const transitions: string[] = [];

    await new Promise<void>((resolve, reject) => {
      tx.signAndSend(alice, (result) => {
        const parsed = sb_extrinsic_status.safeParse(result.status);

        if (parsed.success) {
          const statusType = Object.keys(parsed.data)[0];
          transitions.push(statusType ?? "<unknown>");

          // Log each transition
          console.log(`Status transition: ${statusType}`);
        }

        if (result.status.isFinalized) {
          resolve();
        }
      }).catch(reject);
    });

    // Common transitions: Ready -> Broadcast -> InBlock -> Finalized
    // Or: Ready -> InBlock -> Finalized
    expect(transitions).toContain("Ready");
    expect(transitions).toContain("InBlock");

    // Log all transitions for debugging
    console.log("All transitions:", transitions);
  });
});
