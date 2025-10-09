import { useQuery } from "@tanstack/react-query";
import type { VerificationClaim } from "@/lib/api-schemas";
import { apiFetch } from "@/lib/fetch";

async function fetchVerificationClaimById(
  claimId: number,
): Promise<VerificationClaim> {
  const url = `prediction-verification-claims/${claimId}`;
  const data = await apiFetch<VerificationClaim>(url);
  return data;
}

export function useVerificationClaimByIdQuery(
  claimId: number | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: ["verification-claim-by-id", claimId],
    queryFn: () => {
      if (!claimId) {
        return null;
      }

      return fetchVerificationClaimById(claimId);
    },
    enabled: (options.enabled ?? true) && claimId !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
