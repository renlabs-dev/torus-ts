"use client";
import { fetchProphetFinderStats } from "~/lib/api/fetch-prophet-finder-stats";
import type { ProphetFinderStats } from "~/lib/api/fetch-prophet-finder-stats";
import Link from "next/link";
import * as React from "react";

export default function StatsRow() {
  const [stats, setStats] = React.useState<ProphetFinderStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    // Fetch stats
    fetchProphetFinderStats(controller.signal)
      .then((data) => {
        setStats(data);
        setIsLoadingStats(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load stats");
        setIsLoadingStats(false);
      });

    return () => controller.abort();
  }, []);

  const isLoading = isLoadingStats;
  const hasError = !!error;

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("en-US");
  };

  return (
    <div className="pb-16 text-center font-mono text-sm text-white/75 sm:text-base md:pb-20 md:text-lg">
      <div>
        {isLoading ? (
          <span className="animate-pulse text-white/50">Loading stats...</span>
        ) : hasError ? (
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
            <span className="mx-2 text-white/40">•</span>
            <span>
              <span className="font-bold">
                {formatNumber(stats.profiles_inserted)}
              </span>{" "}
              ADDED PROPHETS
            </span>
            <span className="mx-2 text-white/40">•</span>
            <span>
              <span className="font-bold">
                {formatNumber(stats.predictions_collected)}
              </span>{" "}
              PREDICTIONS COLLECTED
            </span>
          </>
        ) : null}
      </div>
      <div className="mt-2">
        <span className="ml-2">
          Powered by{" "}
          <Link
            className="cursor-pointer font-bold"
            href="https://torus.network/"
          >
            Torus
          </Link>
        </span>
      </div>
    </div>
  );
}
