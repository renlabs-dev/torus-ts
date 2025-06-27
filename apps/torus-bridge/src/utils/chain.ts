import { isAbacusWorksChain } from "@hyperlane-xyz/registry";
import type { ChainName, MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { toTitleCase } from "@hyperlane-xyz/utils";
import { trySync } from "@torus-network/torus-utils/try-catch";

export function getChainDisplayName(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
  shortName = false,
) {
  if (!chain) return "Unknown";

  const [metadataError, metadata] = trySync(() =>
    multiProvider.tryGetChainMetadata(chain),
  );

  if (metadataError !== undefined || !metadata) {
    console.warn(`Error getting chain metadata for ${chain}:`, metadataError);
    return "Unknown";
  }

  const [displayNameError, displayName] = trySync(() =>
    shortName ? metadata.displayNameShort : metadata.displayName,
  );

  if (displayNameError !== undefined) {
    console.warn(`Error getting display name for ${chain}:`, displayNameError);
    return metadata.displayName ?? toTitleCase(metadata.name);
  }

  return displayName ?? metadata.displayName ?? toTitleCase(metadata.name);
}

export function isPermissionlessChain(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
) {
  if (!chain) return true;

  const [metadataError, metadata] = trySync(() =>
    multiProvider.tryGetChainMetadata(chain),
  );

  if (metadataError !== undefined) {
    console.warn(`Error getting chain metadata for ${chain}:`, metadataError);
    return true;
  }

  if (!metadata) return true;

  const [abacusError, isAbacus] = trySync(() => isAbacusWorksChain(metadata));

  if (abacusError !== undefined) {
    console.warn(`Error checking if ${chain} is an Abacus chain:`, abacusError);
    return true;
  }

  return !isAbacus;
}

export function hasPermissionlessChain(
  multiProvider: MultiProtocolProvider,
  ids: ChainName[],
) {
  const [everyError, everyResult] = trySync(() =>
    ids.every((c) => !isPermissionlessChain(multiProvider, c)),
  );

  if (everyError !== undefined) {
    console.warn("Error checking for permissionless chains:", everyError);
    return true; // Conservative approach - assume permissionless chain present on error
  }

  return !everyResult;
}
