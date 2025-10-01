import { PROPHET_FINDER_PROFILES_URL } from "~/lib/api/endpoints";

// Raw API response shape for /api/prophet-finder/profiles
export interface ProphetFinderProfile {
  id: string; // Twitter user snowflake id as a decimal string
  username: string; // lowercase username (without '@')
  display_name: string; // display name
  profile_image_url: string; // may be empty
  follower_count: number; // uint64
  following_count: number; // uint64
  profile_tweet_count: number; // uint64
  scraped_tweet_count: number; // uint64 - how many tweets we've scraped
  last_scraped?: string; // ISO timestamp (optional)
}

export async function fetchProphetFinderProfiles(
  signal?: AbortSignal,
): Promise<ProphetFinderProfile[]> {
  const res = await fetch(PROPHET_FINDER_PROFILES_URL, {
    method: "GET",
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ProphetFinderProfile[];
  return data;
}
