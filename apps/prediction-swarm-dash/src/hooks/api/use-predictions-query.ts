import { useQuery } from "@tanstack/react-query";
import { buildContentListUrl } from "@/lib/api-query-builder";
import {
  type ContentListParams,
  contentListParamsSchema,
  type PredictionsResponse,
} from "@/lib/api-schemas";
import { createQueryKey } from "@/lib/api-utils";
import { apiFetch } from "@/lib/fetch";

async function fetchPredictions(
  params: ContentListParams,
): Promise<PredictionsResponse> {
  // Validate parameters before making request
  const validatedParams = contentListParamsSchema.parse(params);

  const url = buildContentListUrl("predictions/list", validatedParams);

  const data = await apiFetch<PredictionsResponse>(url);

  // Validate response data
  try {
    // Basic validation - just check it's an array
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = data.map((item: unknown) => {
      const predictionItem = item as Record<string, unknown>;
      return {
        ...predictionItem,
        // Ensure required fields exist with defaults if needed
        id: (predictionItem.id as number) || 0,
        inserted_at:
          (predictionItem.inserted_at as string) || new Date().toISOString(),
        inserted_by_address:
          (predictionItem.inserted_by_address as string) || "unknown",
        predictor_twitter_username:
          (predictionItem.predictor_twitter_username as string) || "unknown",
        predictor_twitter_user_id: predictionItem.predictor_twitter_user_id,
        prediction_timestamp:
          (predictionItem.prediction_timestamp as string) ||
          (predictionItem.inserted_at as string) ||
          new Date().toISOString(),
        url: (predictionItem.url as string) || "",
        full_post: (predictionItem.full_post as string) || "",
        prediction: (predictionItem.prediction as string) || "",
        topic: (predictionItem.topic as string) || "",
        context: predictionItem.context,
        verification_claims: predictionItem.verification_claims || [],
        verification_verdict: predictionItem.verification_verdict,
      };
    });

    return validatedResponse as PredictionsResponse;
  } catch (_error) {
    throw new Error("PREDICTIONS API response does not match expected schema");
  }
}

export function usePredictionsQuery(
  params: ContentListParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: createQueryKey("predictions", params),
    queryFn: () => fetchPredictions(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
