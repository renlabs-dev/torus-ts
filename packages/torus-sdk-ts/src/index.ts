import { ApiPromise, WsProvider } from "@polkadot/api";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

// === Address ===
export * from "./address";

// == RPC ==
export * from "./rpc";

// == Modules ==
export * from "./modules/_common";
export * from "./modules/subspace";
export * from "./modules/governance";

// == EVM ==
export * from "./evm";

// == Constants ==
export * from "./constants";

// == Cached Queries ==
export * from "./cached-queries";

// == Types ==
export * from "./types/base";
export * from "./types/index";
export * from "./types/sb_enum";
export * from "./types/zod";

// == Metadata ==
export * from "./metadata";
export * from "./agent_metadata/agent_metadata";

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
