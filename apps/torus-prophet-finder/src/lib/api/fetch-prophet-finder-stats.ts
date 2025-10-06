import { PROPHET_FINDER_STATS_URL } from "~/lib/api/endpoints";

// API response shape for /api/prophet-finder/stats
export interface ProphetFinderStats {
  total_tweets?: number;
  total_users?: number;
  predictions_collected?: number;
  profiles_inserted?: number;
}

export async function fetchProphetFinderStats(
  signal?: AbortSignal,
): Promise<ProphetFinderStats> {
  const res = await fetch(PROPHET_FINDER_STATS_URL, {
    method: "GET",
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ProphetFinderStats;
  return data;
}
