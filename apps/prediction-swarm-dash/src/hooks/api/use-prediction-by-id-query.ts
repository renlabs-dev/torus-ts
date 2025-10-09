import { useQuery } from "@tanstack/react-query";
import type { Prediction } from "~/lib/api-schemas";
import { apiFetch } from "~/lib/fetch";

export function usePredictionByIdQuery(
  predictionId: number | null | undefined,
) {
  const queryResult = useQuery({
    queryKey: ["prediction-by-id", predictionId],
    queryFn: async (): Promise<Prediction> => {
      if (!predictionId) {
        throw new Error("Prediction ID is required");
      }

      const data = await apiFetch<Prediction>(`predictions/${predictionId}`);

      // Normalize the prediction data
      return {
        ...data,
        id: data.id || 0,
        inserted_at: data.inserted_at || new Date().toISOString(),
        inserted_by_address: data.inserted_by_address || "unknown",
        predictor_twitter_username:
          data.predictor_twitter_username || "unknown",
        predictor_twitter_user_id: data.predictor_twitter_user_id,
        prediction_timestamp:
          data.prediction_timestamp ||
          data.inserted_at ||
          new Date().toISOString(),
        url: data.url || "",
        full_post: data.full_post || "",
        prediction: data.prediction || "",
        topic: data.topic || "",
        context: data.context,
        verification_claims: data.verification_claims || [],
        verification_verdict: data.verification_verdict,
      } as Prediction;
    },
    enabled: !!predictionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isError: queryResult.isError,
  };
}
