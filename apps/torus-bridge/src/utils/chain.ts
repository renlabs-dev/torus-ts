import { isAbacusWorksChain } from "@hyperlane-xyz/registry";
import type { ChainName, MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { toTitleCase } from "@hyperlane-xyz/utils";

export function getChainDisplayName(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
  shortName = false,
) {
  if (!chain) return "Unknown";
  const metadata = multiProvider.tryGetChainMetadata(chain);
  if (!metadata) return "Unknown";
  const displayName = shortName
    ? metadata.displayNameShort
    : metadata.displayName;
  return displayName ?? metadata.displayName ?? toTitleCase(metadata.name);
}

export function isPermissionlessChain(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
) {
  if (!chain) return true;
  const metadata = multiProvider.tryGetChainMetadata(chain);
  return !metadata || !isAbacusWorksChain(metadata);
}

export function hasPermissionlessChain(
  multiProvider: MultiProtocolProvider,
  ids: ChainName[],
) {
  return !ids.every((c) => !isPermissionlessChain(multiProvider, c));
}
