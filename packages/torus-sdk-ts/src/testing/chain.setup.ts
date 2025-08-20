import { EventEmitter } from "events";
import { afterAll, beforeAll } from "vitest";

import { getApi } from "./getApi.js";

// TODO: Fix for event listener warnings seems to not be working
//
// Increase EventEmitter listener limit to prevent warnings during live chain
// tests Polkadot.js API creates multiple WebSocket connections with event
// listeners (unpipe, error, close, finish) that can exceed Node.js default
// limit of 26. Set both global default and process-wide limit to handle all
// EventEmitter instances.
EventEmitter.defaultMaxListeners = 128;
process.setMaxListeners(128);

/**
 * Per-worker setup for chain tests.
 * Establishes API connection before tests and cleanly disconnects after.
 */

let disconnect: (() => Promise<void>) | undefined;

beforeAll(async () => {
  console.log("⛓️  Connecting to chain...");
  const api = await getApi();
  await api.isReady;
  console.log("✅ Chain connected");

  disconnect = () =>
    api.disconnect().catch((error) => {
      console.error("❌ Error disconnecting from chain:", error);
    });
});

afterAll(async () => {
  if (disconnect) {
    console.log("⛓️  Disconnecting from chain...");
    await disconnect();
    console.log("✅ Chain disconnected");
  }
});
