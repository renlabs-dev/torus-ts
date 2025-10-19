import { useQuery } from "@tanstack/react-query";
import type {
  ProphetProfilesParams,
  ProphetProfilesResponse,
} from "~/lib/api-schemas";
import { apiFetch } from "~/lib/fetch";

async function fetchProphetProfiles(
  params: ProphetProfilesParams,
): Promise<ProphetProfilesResponse> {
  const searchParams = new URLSearchParams();

  if (params.twitter_username) {
    searchParams.set("twitter_username", params.twitter_username);
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }
  if (params.offset) {
    searchParams.set("offset", params.offset.toString());
  }

  const url = `prophet-finder/profiles${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  return apiFetch<ProphetProfilesResponse>(url);
}

export function useProphetProfilesSearchQuery(
  searchTerm: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["prophet-profiles-search", searchTerm],
    queryFn: () =>
      fetchProphetProfiles({ twitter_username: searchTerm, limit: 10 }),
    enabled: (options.enabled ?? true) && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}
