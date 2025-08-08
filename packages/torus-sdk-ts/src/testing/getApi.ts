import { ApiPromise, WsProvider } from "@polkadot/api";

import { memo } from "@torus-network/torus-utils/misc";

import { getEnv } from "./env.js";

/**
 * Lazily create and cache ApiPromise instance for chain tests.
 * Reuses the same connection across all tests to avoid connection overhead.
 */
export const getApi = memo((): Promise<ApiPromise> => {
  const env = getEnv();
  return ApiPromise.create({
    provider: new WsProvider(env.CHAIN_RPC_URL),
  });
});
