"use client";

import { fetchProphetFinderStats } from "~/lib/api/fetch-prophet-finder-stats";
import type { ProphetFinderStats } from "~/lib/api/fetch-prophet-finder-stats";
import * as React from "react";

export default function StatsRow() {
  const [stats, setStats] = React.useState<ProphetFinderStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    fetchProphetFinderStats(controller.signal)
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load stats");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "0";
    return num.toLocaleString("en-US");
  };

  return (
    <div className="pb-16 text-center font-mono text-sm text-white/75 sm:text-base md:pb-20 md:text-lg">
      <div>
        {isLoading ? (
          <span className="animate-pulse text-white/50">Loading stats...</span>
        ) : error ? (
          <span className="text-red-300/70">{error}</span>
        ) : stats ? (
          <>
            <span>
              <span className="font-bold">
                {formatNumber(stats.total_tweets)}
              </span>{" "}
              TWEETS COLLECTED
            </span>
            <span className="mx-2 text-white/40">•</span>
            <span>
              <span className="font-bold">
                {formatNumber(stats.total_users)}
              </span>{" "}
              TRACKED USERS
            </span>
          </>
        ) : null}
      </div>
      <div className="mt-2">
        <span className="ml-2">
          Powered by <span className="font-bold">Torus</span>
        </span>
      </div>
    </div>
  );
}
