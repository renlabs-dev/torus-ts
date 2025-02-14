import { ApiPromise, WsProvider } from "@polkadot/api";

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
  const api = await ApiPromise.create({ provider });
  return api;
}
