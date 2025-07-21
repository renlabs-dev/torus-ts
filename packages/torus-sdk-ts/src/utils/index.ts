import { ApiPromise, WsProvider } from "@polkadot/api";

/**
 * Connect to a Torus chain RPC endpoint
 * @param wsEndpoint - WebSocket endpoint URL
 * @returns Connected ApiPromise instance
 */
export async function connectToChainRpc(
  wsEndpoint: string,
): Promise<ApiPromise> {
  console.debug("Connecting to chain RPC endpoint:", wsEndpoint);

  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });

  if (!api.isConnected) {
    throw new Error("API not connected");
  }

  return api;
}
