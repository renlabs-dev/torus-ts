import { defineChain } from "viem";

export const TORUS_EVM_RPC_URL = "https://api.torus.network";

export const torusEvm = defineChain({
  id: 21000,
  name: "Torus EVM",
  nativeCurrency: { decimals: 18, name: "Torus", symbol: "TORUS" },
  rpcUrls: {
    default: { http: [TORUS_EVM_RPC_URL] },
  },
});
