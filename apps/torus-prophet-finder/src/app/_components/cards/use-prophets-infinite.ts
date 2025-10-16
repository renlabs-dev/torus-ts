"use client";

import type { ProphetFinderProfile } from "~/lib/api/fetch-prophet-finder-profiles";
import { fetchProphetFinderProfiles } from "~/lib/api/fetch-prophet-finder-profiles";
import { titleFromHandle } from "~/lib/handles/title-from-handle";
import { upgradeTwitterAvatarUrl } from "~/lib/images/upgrade-twitter-avatar";
import type { Prophet } from "~/types/prophet";
import { useCallback, useState } from "react";

const ITEMS_PER_PAGE = 12;

interface UseProphetsInfiniteOptions {
  search?: string;
}

export function useProphetsInfinite(options?: UseProphetsInfiniteOptions) {
  const { search } = options ?? {};
  const [prophets, setProphets] = useState<Prophet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const mapProfile = useCallback((p: ProphetFinderProfile): Prophet => {
    const username = p.username;
    const displayName = p.display_name.trim();
    const title =
      displayName && displayName.length > 0
        ? displayName
        : titleFromHandle(username);
    const img = upgradeTwitterAvatarUrl(p.profile_image_url.trim());
    const totalTweets = p.profile_tweet_count;
    const scrapedTweets = p.scraped_tweet_count;
    const progressPct =
      totalTweets > 0
        ? Math.round((scrapedTweets / totalTweets) * 100 * 100) / 100
        : 0;
    return {
      name: title,
      handle: `@${username}`,
      twitterUrl: `https://twitter.com/${username}`,
      imageSrc:
        img && img.length > 0
          ? img
          : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReQyGbfF6C-eWeXnIy33IEo2nDtJj5Od5Ygw&s",
      followers: p.follower_count,
      tweetsCurrent: scrapedTweets,
      tweetsTotal: totalTweets,
      collectionProgress: progressPct,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profiles = await fetchProphetFinderProfiles({
        limit: ITEMS_PER_PAGE,
        offset: 0,
        twitter_username: search || undefined,
      });

      const mapped = profiles.map(mapProfile);
      const sortedByProgress = [...mapped].sort(
        (a, b) => b.collectionProgress - a.collectionProgress,
      );

      setProphets(sortedByProgress);
      setOffset(ITEMS_PER_PAGE);
      setHasMore(profiles.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load prophets"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, mapProfile]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const profiles = await fetchProphetFinderProfiles({
        limit: ITEMS_PER_PAGE,
        offset,
        twitter_username: search || undefined,
      });

      const mapped = profiles.map(mapProfile);

      setProphets((prev) => {
        const combined = [...prev, ...mapped];
        return [...combined].sort(
          (a, b) => b.collectionProgress - a.collectionProgress,
        );
      });

      setOffset((prev) => prev + ITEMS_PER_PAGE);
      setHasMore(profiles.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load more prophets"),
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [offset, hasMore, isLoadingMore, search, mapProfile]);

  return {
    prophets,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadInitial,
    loadMore,
  };
}
