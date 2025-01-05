import type { ChainName, MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { toBase64 } from "@hyperlane-xyz/utils";
import { config } from "../consts/config";

import { isPermissionlessChain } from "./chain";
import { links } from "@torus-ts/ui";

export function getHypExplorerLink(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
  msgId?: string,
) {
  if (!config.enableExplorerLink || !chain || !msgId) return null;
  const baseLink = `${links.hyperlane_explorer}/message/${msgId}`;

  if (!isPermissionlessChain(multiProvider, chain)) return baseLink;

  const chainMetadata = multiProvider.tryGetChainMetadata(chain);
  if (!chainMetadata) return baseLink;

  const serializedConfig = toBase64([chainMetadata]);
  if (!serializedConfig) return baseLink;

  const params = new URLSearchParams({ chains: serializedConfig });
  return `${baseLink}?${params.toString()}`;
}
