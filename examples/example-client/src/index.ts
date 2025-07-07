import * as torus from "@torus-network/sdk";

import { ApiPromise, WsProvider } from "@polkadot/api";

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  if (!api.isConnected) {
    throw new Error("API not connected");
  }
  console.log("API connected");
  return api;
}

async function main() {
  const api = await connectToChainRpc("wss://api.testnet.torus.network");

  const agents = await torus.queryAgents(api);
  console.log(agents);

  await api.disconnect();
}

await main();
