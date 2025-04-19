import { useQuery } from "@tanstack/react-query";
import type { AgentMetadataResult } from "@torus-network/sdk";
import { fetchAgentMetadata } from "@torus-network/sdk";
import { isIpfsUri } from "@torus-network/torus-utils/ipfs";

declare global {
  interface Window {
    __PREVIEW_METADATA__?: AgentMetadataResult;
  }
}

const DEFAULT_STALE_TIME = 1000 * 60 * 5;
const IPFS_STALE_TIME = Infinity;

interface UseQueryAgentMetadataOptions {
  fetchImages?: boolean;
  enabled?: boolean;
}

const isClientSide = (): boolean => typeof window !== "undefined";

const getClientSideMetadata = () => {
  if (!isClientSide()) return undefined;
  return window.__PREVIEW_METADATA__ ?? undefined;
};

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

      return fetchAgentMetadata(metadataUri, { fetchImages });
    },
    retry: 1,
    staleTime,
    enabled: enabled && !!metadataUri,
  });
};
