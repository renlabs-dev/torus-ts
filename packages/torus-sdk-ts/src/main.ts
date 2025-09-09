/* eslint-disable */
import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { match } from "rustie";
import {
  parseSubmittableResult,
  sb_dispatch_error,
  sb_dispatch_info,
  sb_event_record,
  sb_extrinsic_status,
} from "./extrinsics.js";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// // $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api.testnet.torus.network";

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  if (!api.isConnected) {
    throw new Error("API not connected");
  }
  console.log("API connected");
  return api;
}

const api = await connectToChainRpc(NODE_URL);

// =============================================================================

// Create test accounts
const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");
const bob = keyring.addFromUri("//Bob");

// Helper function to test a transaction
async function testTransaction(
  name: string,
  tx: any,
  signer: any,
  options = {},
): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log(`🧪 Test Case: ${name}`);
  console.log("=".repeat(70));

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("\n⏱️ Test timed out after 10 seconds");
      resolve();
    }, 10000);

    tx.signAndSend(signer, options, (rawResult: any) => {
      console.log("\n📡 Status:", rawResult.status.toString());

      // Test our new transformation functions
      try {
        // Step 1: Parse the raw result to SbSubmittableResult
        const { result, txState } = parseSubmittableResult(rawResult);

        console.log("\n📦 Parsed SubmittableResult:");
        console.log("- txHash:", result.txHash);
        console.log("- status type:", Object.keys(result.status)[0]);
        console.log("- has dispatchError:", result.dispatchError !== undefined);
        console.log("- has dispatchInfo:", result.dispatchInfo !== undefined);
        console.log("- events count:", result.events.length);

        // Step 2: Transform to high-level TxState
        console.log("\n🔄 Transformed to TxState:");
        const updateType = Object.keys(txState)[0];
        console.log("- Update type:", updateType);

        // Use rustie's match to handle the TxState
        match(txState)({
          Pool: ({ txHash, kind }) => {
            console.log(`  → Transaction in pool (${kind})`);
            console.log(`    Hash: ${txHash}`);
          },
          Included: ({ txHash, blockHash, outcome, kind, events }) => {
            console.log(`  → Transaction included in block (status: ${kind})`);
            console.log(`    Tx Hash: ${txHash}`);
            console.log(`    Block Hash: ${blockHash}`);
            console.log(`    Events: ${events.length}`);

            // Check the outcome
            match(outcome)({
              Success: ({ info }) => {
                console.log("    ✅ Success!");
                console.log(`    Weight: ${info.weight.refTime}`);
                console.log(`    Pays fee: ${Object.keys(info.paysFee)[0]}`);
              },
              Failed: ({ error }) => {
                console.log("    ❌ Failed!");
                console.log(`    Error type: ${Object.keys(error)[0]}`);
                if ("BadOrigin" in error) {
                  console.log(
                    "    Error: BadOrigin - insufficient permissions",
                  );
                }
              },
            });
          },
          Warning: ({ txHash, kind }) => {
            console.log(`  → Warning: ${kind}`);
            console.log(`    Hash: ${txHash}`);
          },
          Evicted: ({ txHash, kind, reason }) => {
            console.log(`  → Transaction evicted (${kind})`);
            console.log(`    Hash: ${txHash}`);
            if (reason) console.log(`    Reason: ${reason.message}`);
          },
          Invalid: ({ txHash, reason }) => {
            console.log(`  → Transaction invalid`);
            console.log(`    Hash: ${txHash}`);
            if (reason) console.log(`    Reason: ${reason.message}`);
          },
          InternalError: ({ txHash, error }) => {
            console.log(`  → Internal error`);
            console.log(`    Hash: ${txHash}`);
            console.log(`    Error: ${error.message}`);
          },
        });
      } catch (error) {
        console.error("Failed to test new transformation functions:", error);
      }

      // Check if transaction is finalized or failed
      if (
        rawResult.status.isFinalized ||
        rawResult.status.isInvalid ||
        rawResult.status.isDropped
      ) {
        console.log("\n🏁 Terminal state reached");
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

// ========================================================================
// Run all test cases sequentially
// ========================================================================

// Test 1: Success case - simple remark
const successTx = api.tx.system.remark("Test success");
await testTransaction("SUCCESS - System Remark", successTx, alice);

// Test 2: Failure case - transfer more than available balance
const failTx = api.tx.balances.transferKeepAlive(
  bob.address,
  BigInt("999999999999999999999999"),
);
await testTransaction("FAILURE - Insufficient Balance", failTx, alice);

// Test 3: Invalid case - bad nonce
const invalidTx = api.tx.system.remark("Test invalid");
await testTransaction("INVALID - Bad Nonce", invalidTx, alice, {
  nonce: 999999,
});

// ========================================================================

console.log("\n" + "=".repeat(70));
console.log("✅ All tests completed!");
console.log("=".repeat(70));

// Disconnect
await api.disconnect();
console.log("\n🔌 API disconnected");
