import { useClaimProofBundle } from "~/hooks/use-claim-proof-bundle";
import { getProofForAccount } from "~/lib/claim-proof-bundle";
import type { ProofData } from "~/lib/claim-proof-bundle";

export type { ProofData } from "~/lib/claim-proof-bundle";

export interface ProofQuery {
  data: ProofData | null | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function useProof(address: `0x${string}` | undefined): ProofQuery {
  const bundleQuery = useClaimProofBundle({ enabled: address !== undefined });

  return {
    data:
      address !== undefined && bundleQuery.data !== undefined
        ? getProofForAccount(bundleQuery.data, address)
        : undefined,
    isPending: address !== undefined && bundleQuery.isPending,
    isError: bundleQuery.isError,
    error: bundleQuery.error,
  };
}
