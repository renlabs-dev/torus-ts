/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import type { ChainMap } from "@hyperlane-xyz/sdk";
import { env } from "~/env";
import { ADDRESS_BLACKLIST } from "./blacklist";

const isDevMode = env("NEXT_PUBLIC_NODE_ENV") === "development";
const version = env("NEXT_PUBLIC_VERSION") ?? "0.0.0";
const registryUrl = env("NEXT_PUBLIC_REGISTRY_URL") ?? undefined;
const registryBranch = env("NEXT_PUBLIC_REGISTRY_BRANCH") ?? undefined;
const registryProxyUrl =
  env("NEXT_PUBLIC_GITHUB_PROXY") ?? "https://proxy.hyperlane.xyz";
const walletConnectProjectId = env("NEXT_PUBLIC_WALLET_CONNECT_ID") ?? "";
const transferBlacklist = env("NEXT_PUBLIC_TRANSFER_BLACKLIST") ?? "";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const chainWalletWhitelists = JSON.parse(
  env("NEXT_PUBLIC_CHAIN_WALLET_WHITELISTS") ?? "{}",
);

interface Config {
  addressBlacklist: string[]; // A list of addresses that are blacklisted and cannot be used in the app
  chainWalletWhitelists: ChainMap<string[]>; // A map of chain names to a list of wallet names that work for it
  enableExplorerLink: boolean; // Include a link to the hyperlane explorer in the transfer modal
  isDevMode: boolean; // Enables some debug features in the app
  registryUrl: string | undefined; // Optional URL to use a custom registry instead of the published canonical version
  registryBranch?: string | undefined; // Optional customization of the registry branch instead of main
  registryProxyUrl?: string; // Optional URL to use a custom proxy for the GithubRegistry
  showDisabledTokens: boolean; // Show/Hide invalid token options in the selection modal
  transferBlacklist: string; // comma-separated list of routes between which transfers are disabled. Expects Caip2Id-Caip2Id (e.g. ethereum:1-sealevel:1399811149)
  version: string; // Matches version number in package.json
  walletConnectProjectId: string; // Project ID provided by walletconnect
}

export const config: Config = Object.freeze({
  addressBlacklist: ADDRESS_BLACKLIST.map((address) => address.toLowerCase()),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  chainWalletWhitelists,
  enableExplorerLink: false,
  isDevMode,
  registryUrl,
  registryBranch,
  registryProxyUrl,
  showDisabledTokens: false,
  version,
  transferBlacklist,
  walletConnectProjectId,
});
