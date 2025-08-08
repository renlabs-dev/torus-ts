/* eslint-disable */
import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";

import { BasicLogger } from "@torus-network/torus-utils/logger";

import {
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

// Create a test account (Alice for development)
const keyring = new Keyring({ type: "sr25519" });
const alice = keyring.addFromUri("//Alice");

// Try to trigger a dispatch error - let's try calling a restricted function
// or create a transaction that will fail during execution
console.log("Creating a transaction that should fail...");

// Try to set a storage item that requires root origin (should fail)
const failingTx = api.tx.system.setStorage([
  ["0x1234", "0x5678"], // Random storage key/value that we don't have permission to set
]);

console.log("Submitting transaction that should fail with BadOrigin...");

const unsubscribe = await failingTx.signAndSend(alice, (result) => {
  console.log("\n=== Raw SubmittableResult ===");
  console.log("Status:", result.status.toString());
  console.log("Status type:", result.status.type);

  // Parse individual components with our parsers
  try {
    // Parse the status
    const parsedStatus = sb_extrinsic_status.parse(result.status);
    console.log("\n=== Parsed Status ===");
    console.log("Parsed status:", parsedStatus);

    // Parse events if available
    if (result.events && result.events.length > 0) {
      console.log("\n=== Raw Events ===");
      result.events.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          phase: event.phase.toString(),
          section: event.event.section,
          method: event.event.method,
          data: event.event.data.toString(),
        });
      });

      // Try parsing with our parser
      console.log("\n=== Parsing Events ===");
      const parsedEvents = result.events.map((event, index) => {
        try {
          const parsed = sb_event_record.parse(event);
          console.log(`Event ${index} parsed successfully`);
          return parsed;
        } catch (e) {
          console.log(`Event ${index} parse failed - using raw data`);
          // Return raw event data instead
          return {
            phase: event.phase.toString(),
            event: {
              section: event.event.section,
              method: event.event.method,
              data: event.event.data.map((d) => d.toString()),
            },
            topics: event.topics.map((t) => t.toHex()),
          };
        }
      });
      console.log(`Processed ${parsedEvents.length} events`);
    }

    // Parse dispatch info if available
    if (result.dispatchInfo) {
      try {
        const parsedInfo = sb_dispatch_info.parse(result.dispatchInfo);
        console.log("\n=== Parsed Dispatch Info ===");
        console.log("Dispatch info:", parsedInfo);
      } catch (e) {
        console.error("Failed to parse dispatch info:", e);
      }
    }

    // Parse dispatch error if available
    if (result.dispatchError) {
      try {
        const parsedError = sb_dispatch_error.parse(result.dispatchError);
        console.log("\n=== Parsed Dispatch Error ===");
        console.log("Dispatch error:", parsedError);
      } catch (e) {
        console.error("Failed to parse dispatch error:", e);
      }
    }
  } catch (error) {
    console.error("Failed to parse components:", error);
  }

  // Check if transaction is finalized or failed
  if (result.status.isFinalized) {
    console.log("\n✅ Transaction finalized!");
    console.log("Block hash:", result.status.asFinalized.toHex());
    unsubscribe();
  }

  if (result.status.isInvalid || result.status.isDropped) {
    console.log("\n❌ Transaction failed!");
    unsubscribe();
  }

  // Check for dispatch error
  if (result.dispatchError) {
    console.log("\n❌ Transaction resulted in dispatch error!");
  }
});

// Wait a bit for the transaction to process
await new Promise((resolve) => setTimeout(resolve, 10000));

// =============================================================================

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
