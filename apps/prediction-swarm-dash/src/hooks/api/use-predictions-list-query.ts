import { useQuery } from "@tanstack/react-query";
import type {
  PredictionsListParams,
  PredictionsResponse,
} from "~/lib/api-schemas";
import { createQueryKey } from "~/lib/api-utils";
import { apiFetch } from "~/lib/fetch";

async function fetchPredictionsList(
  params: PredictionsListParams = {},
): Promise<PredictionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.agent_address) {
    searchParams.set("agent_address", params.agent_address);
  }
  if (params.from) {
    searchParams.set("from", params.from);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }
  if (params.offset) {
    searchParams.set("offset", params.offset.toString());
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.sort_by) {
    searchParams.set("sort_by", params.sort_by);
  }
  if (params.sort_order) {
    searchParams.set("sort_order", params.sort_order);
  }

  const url = `predictions/list${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  return apiFetch<PredictionsResponse>(url);
}

export function usePredictionsListQuery(
  params: PredictionsListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: createQueryKey("predictions-list", params),
    queryFn: () => fetchPredictionsList(params),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
  });
}
