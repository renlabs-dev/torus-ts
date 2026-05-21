import { defineChain } from "viem";

export const torusEvm = defineChain({
  id: 21000,
  name: "Torus EVM",
  nativeCurrency: { decimals: 18, name: "Torus", symbol: "TORUS" },
  rpcUrls: {
    default: { http: ["https://api.torus.network"] },
  },
});
