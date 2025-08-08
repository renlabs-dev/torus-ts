import { afterAll, beforeAll } from "vitest";

import { getApi } from "./src/testing/getApi.js";

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

  disconnect = () => api.disconnect().catch(() => {});
});

afterAll(async () => {
  if (disconnect) {
    console.log("⛓️  Disconnecting from chain...");
    await disconnect();
    console.log("✅ Chain disconnected");
  }
});
