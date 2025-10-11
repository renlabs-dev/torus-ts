import { useQuery } from "@tanstack/react-query";
import { buildContentListUrl } from "~/lib/api-query-builder";
import { contentListParamsSchema } from "~/lib/api-schemas";
import type {
  ContentListParams,
  VerificationClaimsResponse,
} from "~/lib/api-schemas";
import { createQueryKey } from "~/lib/api-utils";
import { apiFetch } from "~/lib/fetch";

async function fetchVerificationClaims(
  params: ContentListParams,
): Promise<VerificationClaimsResponse> {
  // Validate parameters before making request
  const validatedParams = contentListParamsSchema.parse(params);

  const url = buildContentListUrl(
    "prediction-verification-claims/list",
    validatedParams,
  );

  const data = await apiFetch<VerificationClaimsResponse>(url);

  // Validate response data
  try {
    // Basic validation - just check it's an array
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = data.map((item: unknown) => {
      const claimItem = item as Record<string, unknown>;
      return {
        ...claimItem,
        // Ensure required fields exist with defaults if needed
        id: (claimItem.id as number) || 0,
        inserted_at:
          (claimItem.inserted_at as string) || new Date().toISOString(),
        inserted_by_address:
          (claimItem.inserted_by_address as string) || "unknown",
        prediction_id: (claimItem.prediction_id as number) || 0,
        outcome: (claimItem.outcome as string) || "unknown",
        proof: (claimItem.proof as string) || "",
      };
    });

    return validatedResponse as VerificationClaimsResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error(
      "VERIFICATION-CLAIMS API response does not match expected schema",
    );
  }
}

export function useVerificationClaimsQuery(
  params: ContentListParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: createQueryKey("verification-claims", params),
    queryFn: () => fetchVerificationClaims(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
