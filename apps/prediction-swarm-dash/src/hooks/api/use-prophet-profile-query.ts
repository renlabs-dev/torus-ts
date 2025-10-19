import { useQuery } from "@tanstack/react-query";
import type {
  ProphetProfile,
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

export function useProphetProfileQuery(username: string) {
  return useQuery({
    queryKey: ["prophet-profile", username],
    queryFn: () =>
      fetchProphetProfiles({ twitter_username: username, limit: 1 }),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    select: (data): ProphetProfile | null => data[0] ?? null,
  });
}
