import { ApiPromise, WsProvider } from "@polkadot/api";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

// === Address ===
export * from "./address.js";

// == RPC ==
export * from "./rpc.js";

// == Modules ==
export * from "./modules/_common.js";
export * from "./modules/subspace.js";
export * from "./modules/governance.js";
export * from "./modules/permission0.js";
export * from "./modules/torus0.js";

// == EVM ==
export * from "./evm.js";

// == Constants ==
export * from "./constants.js";

// == Cached Queries ==
export * from "./cached-queries.js";

// == Types ==
export * from "./types/base.js";
export * from "./types/index.js";
export * from "./types/sb_enum.js";
export * from "./types/zod.js";
export * from "./types/events.js";

// == Metadata ==
export * from "./metadata.js";
export * from "./agent_metadata/agent_metadata.js";

export * as AgentClient from "./agent-client/index.js";

export async function setup(wsEndpoint: string): Promise<ApiPromise> {
  console.log("Connecting to ", wsEndpoint);
  const provider = new WsProvider(wsEndpoint);
  const [error, api] = await tryAsync(ApiPromise.create({ provider }));
  if (error !== undefined) {
    console.error("Error creating API:", error);
    throw error;
  }
  return api;
}
