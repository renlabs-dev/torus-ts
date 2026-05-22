import { useQuery } from "@tanstack/react-query";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  CLAIM_PROOF_BUNDLE_PATH,
  parseClaimProofBundle,
} from "~/lib/claim-proof-bundle";
import type { ClaimProofBundle } from "~/lib/claim-proof-bundle";

const CLAIM_PROOF_BUNDLE_QUERY_KEY = ["claim-proof-bundle"] as const;

export function useClaimProofBundle({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  return useQuery<ClaimProofBundle, Error>({
    queryKey: CLAIM_PROOF_BUNDLE_QUERY_KEY,
    queryFn: fetchClaimProofBundle,
    enabled,
    retry: false,
    staleTime: Infinity,
  });
}

async function fetchClaimProofBundle(): Promise<ClaimProofBundle> {
  const [fetchError, response] = await tryAsync(fetch(CLAIM_PROOF_BUNDLE_PATH));

  if (fetchError !== undefined) throw fetchError;

  if (!response.ok) {
    throw new Error(`Claim proof bundle fetch failed: HTTP ${response.status}`);
  }

  const [jsonError, data] = await tryAsync(response.json() as Promise<unknown>);

  if (jsonError !== undefined) throw jsonError;

  return parseClaimProofBundle(data);
}
