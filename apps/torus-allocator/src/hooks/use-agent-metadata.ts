import { useQuery } from "@tanstack/react-query";
import type { AgentMetadataResult } from "@torus-network/sdk";
import { fetchAgentMetadata } from "@torus-network/sdk";
import { isIpfsUri } from "@torus-network/torus-utils/ipfs";

const DEFAULT_STALE_TIME = 1000 * 60 * 5;
const IPFS_STALE_TIME = Infinity;

interface UseQueryAgentMetadataOptions {
  fetchImages?: boolean;
  enabled?: boolean;
}

const isClientSide = (): boolean => typeof window !== "undefined";

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
const getClientSideMetadata = (): AgentMetadataResult | null =>
  isClientSide() ? (window.__PREVIEW_METADATA__ ?? null) : null;

export const useQueryAgentMetadata = (
  metadataUri: string,
  { fetchImages = true, enabled = true }: UseQueryAgentMetadataOptions = {},
) => {
  const staleTime = isIpfsUri(metadataUri)
    ? IPFS_STALE_TIME
    : DEFAULT_STALE_TIME;

  return useQuery<AgentMetadataResult, Error>({
    queryKey: ["agentMetadata", metadataUri],
    queryFn: async () => {
      const clientSideMetadata = getClientSideMetadata();
      if (clientSideMetadata) return clientSideMetadata;

      if (!metadataUri) throw new Error("metadataUri is required");

      return fetchAgentMetadata(metadataUri, { fetchImages });
    },
    retry: 1,
    staleTime,
    enabled: enabled && !!metadataUri,
  });
};
