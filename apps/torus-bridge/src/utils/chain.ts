import type {
  ChainMap,
  ChainName,
  MultiProtocolProvider,
  WarpCore,
} from "@hyperlane-xyz/sdk";
import { toTitleCase, trimToLength } from "@hyperlane-xyz/utils";
import type { ChainSearchMenuProps } from "@hyperlane-xyz/widgets";

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

/**
 * Returns an object that contains the amount of
 * routes from a single chain to every other chain
 */
export function getNumRoutesWithSelectedChain(
  warpCore: WarpCore,
  selectedChain: ChainName,
  isSelectedChainOrigin: boolean,
): ChainSearchMenuProps["customListItemField"] {
  const multiProvider = warpCore.multiProvider;
  const chains = multiProvider.metadata;
  const selectedChainDisplayName = trimToLength(
    getChainDisplayName(multiProvider, selectedChain, true),
    10,
  );

  const data = Object.keys(chains).reduce<
    ChainMap<{ display: string; sortValue: number }>
  >((result, otherChain) => {
    const origin = isSelectedChainOrigin ? selectedChain : otherChain;
    const destination = isSelectedChainOrigin ? otherChain : selectedChain;
    const tokens = warpCore.getTokensForRoute(origin, destination).length;
    result[otherChain] = {
      display: `${tokens} route${tokens > 1 ? "s" : ""}`,
      sortValue: tokens,
    };

    return result;
  }, {});

  const preposition = isSelectedChainOrigin ? "from" : "to";
  return {
    header: `Routes ${preposition} ${selectedChainDisplayName}`,
    data,
  };
}
