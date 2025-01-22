import { useQuery } from "@tanstack/react-query";
import { fetchAgentMetadata } from "@torus-ts/subspace";

export const useAgentMetadata = (metadataUri: string) => {
  let staleTime = 1000 * 60 * 5; // 5 minutes

  // If the metadata URI is an IPFS URI, we don't want to refetch it
  if (metadataUri.startsWith("ipfs://")) {
    staleTime = Infinity;
  }

  return useQuery({
    queryKey: ["agentMetadata", metadataUri],
    queryFn: async () => {
      return await fetchAgentMetadata(metadataUri, {
        fetchImages: true,
      });
    },
    staleTime,
    retry: 1,
  });
};
