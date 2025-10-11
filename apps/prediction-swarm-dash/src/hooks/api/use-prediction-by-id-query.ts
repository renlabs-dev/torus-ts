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

      // Return the data as-is since it's already typed
      return data;
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
