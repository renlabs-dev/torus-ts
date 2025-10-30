import { useQuery } from "@tanstack/react-query";
import type {
  UsernamesListParams,
  UsernamesWithCountsResponse,
} from "~/lib/api-schemas";
import { usernamesWithCountsResponseSchema } from "~/lib/api-schemas";
import { apiFetch } from "~/lib/fetch";

async function fetchUsernames(
  params: UsernamesListParams,
): Promise<UsernamesWithCountsResponse> {
  const searchParams = new URLSearchParams();

  if (params.twitter_username) {
    searchParams.set("twitter_username", params.twitter_username);
  }

  const url = `predictions/usernames${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const data = await apiFetch<unknown>(url);
  return usernamesWithCountsResponseSchema.parse(data);
}

export function useUsernamesSearchQuery(
  searchTerm: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["usernames-search", searchTerm],
    queryFn: () => fetchUsernames({ twitter_username: searchTerm || null }),
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}
