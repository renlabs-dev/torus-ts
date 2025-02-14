import { useQuery } from "@tanstack/react-query";
import { fetchAgentMetadata } from "@torus-ts/subspace";
import { isIpfsUri } from "@torus-ts/utils/ipfs";
import { assert } from "tsafe";

/** Default stale time */
const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 5 minutes

/**
 * Custom hook to query agent metadata.
 *
 * @param metadataUri - The URI of the metadata to query. If the URI is an IPFS
 * URI, the data will not be re-fetched.
 *
 * @remarks
 * - The query will be enabled only if `metadataUri` is not null.
 * - If the `metadataUri` starts with "ipfs://", the data will be considered
 *   stale indefinitely.
 * - The query will retry once in case of failure.
 *
 * @example
 * ```typescript
 * const { data, error, isLoading } = useQueryAgentMetadata("ipfs://exampleUri");
 * ```
 */
export const useQueryAgentMetadata = (
  metadataUri: string | null,
  { fetchImages = true } = {},
) => {
  let staleTime = DEFAULT_STALE_TIME;

  // If the metadata URI is an IPFS URI, we don't want to refetch it
  if (metadataUri != null && isIpfsUri(metadataUri)) {
    staleTime = Infinity;
  }

  return useQuery({
    queryKey: ["agentMetadata", metadataUri],
    enabled: metadataUri != null,
    queryFn: async () => {
      assert(metadataUri != null);
      return await fetchAgentMetadata(metadataUri, {
        fetchImages,
      });
    },
    staleTime,
    retry: 1,
  });
};
