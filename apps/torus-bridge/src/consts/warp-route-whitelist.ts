// A list of warp route config IDs to be included in the app
// Warp Route IDs use format `SYMBOL/chainname1-chainname2...` where chains are ordered alphabetically
// If left null, all warp routes in the configured registry will be included
// If set to a list (including an empty list), only the specified routes will be included

import { env } from "~/env";

const warpRoute = {
  mainnet: "TORUS/base-torus",
  testnet: "TORUS/basesepolia-torustestnet",
}[env.NEXT_PUBLIC_CHAIN_ENV];

export const warpRouteWhitelist: string[] | null = [
  warpRoute,
  // 'ETH/ethereum-viction'
];

// Or keep it as null to include all routes:
// export const warpRouteWhitelist: Array<string> | null = null;
