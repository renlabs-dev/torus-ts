import { useQuery } from "@tanstack/react-query";
import {
  contentListParamsSchema,
  contentScoresResponseSchema,
} from "~/lib/api-schemas";
import type {
  ContentListParams,
  ContentScoresResponse,
} from "~/lib/api-schemas";
import { apiFetch } from "~/lib/fetch";

async function fetchContentScores(
  params: ContentListParams,
): Promise<ContentScoresResponse> {
  // Validate parameters before making request
  const validatedParams = contentListParamsSchema.parse(params);

  const searchParams = new URLSearchParams();

  if (validatedParams.agent_address) {
    searchParams.set("agent_address", validatedParams.agent_address);
  }
  if (validatedParams.from) {
    searchParams.set("from", validatedParams.from);
  }
  if (validatedParams.to) {
    searchParams.set("to", validatedParams.to);
  }
  if (validatedParams.limit) {
    searchParams.set("limit", validatedParams.limit.toString());
  }
  if (validatedParams.offset) {
    searchParams.set("offset", validatedParams.offset.toString());
  }

  const url = `content-scores/list${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const data = await apiFetch<ContentScoresResponse>(url);

  // Validate response data
  try {
    const validatedResponse = contentScoresResponseSchema.parse(data);
    return validatedResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("API response does not match expected schema");
  }
}

export function useContentScoresQuery(
  params: ContentListParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["content-scores", params],
    queryFn: () => fetchContentScores(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
