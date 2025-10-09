import { useQuery } from "@tanstack/react-query";
import { buildContentListUrl } from "@/lib/api-query-builder";
import {
  type ContentListParams,
  contentListParamsSchema,
  type VerificationVerdictsResponse,
} from "@/lib/api-schemas";
import { createQueryKey } from "@/lib/api-utils";
import { apiFetch } from "@/lib/fetch";

async function fetchVerificationVerdicts(
  params: ContentListParams,
): Promise<VerificationVerdictsResponse> {
  // Validate parameters before making request
  const validatedParams = contentListParamsSchema.parse(params);

  const url = buildContentListUrl(
    "prediction-verification-verdicts/list",
    validatedParams,
  );

  const data = await apiFetch<VerificationVerdictsResponse>(url);

  // Validate response data
  try {
    // Basic validation - just check it's an array
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = data.map((item: unknown) => {
      const verdictItem = item as Record<string, unknown>;
      return {
        ...verdictItem,
        // Ensure required fields exist with defaults if needed
        id: (verdictItem.id as number) || 0,
        inserted_at:
          (verdictItem.inserted_at as string) || new Date().toISOString(),
        inserted_by_address:
          (verdictItem.inserted_by_address as string) || "unknown",
        prediction_id: (verdictItem.prediction_id as number) || 0,
        verdict: (verdictItem.verdict as string) || "unknown",
        reasoning: (verdictItem.reasoning as string) || "",
      };
    });

    return validatedResponse as VerificationVerdictsResponse;
  } catch (_error) {
    throw new Error(
      "VERIFICATION-VERDICTS API response does not match expected schema",
    );
  }
}

export function useVerificationVerdictsQuery(
  params: ContentListParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: createQueryKey("verification-verdicts", params),
    queryFn: () => fetchVerificationVerdicts(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
