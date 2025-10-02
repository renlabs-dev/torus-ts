"use client";

import { fetchProphetFinderProfiles } from "~/lib/api/fetch-prophet-finder-profiles";
import { normalizeHandle } from "~/lib/handles/normalize-handle";
import { titleFromHandle } from "~/lib/handles/title-from-handle";
import { validateHandleInput } from "~/lib/handles/validate-handle";
import { upgradeTwitterAvatarUrl } from "~/lib/images/upgrade-twitter-avatar";
import type { Prophet } from "~/types/prophet";
import * as React from "react";

export function useProphets() {
  const [prophets, setProphets] = React.useState<Prophet[]>([]);

  const sortByProgressDesc = React.useCallback((list: Prophet[]) => {
    return [...list].sort(
      (a, b) => b.collectionProgress - a.collectionProgress,
    );
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      try {
        const profiles = await fetchProphetFinderProfiles(controller.signal);
        if (cancelled) return;
        const mapped: Prophet[] = profiles.map((p) => {
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
          } satisfies Prophet;
        });
        setProphets((prev) => {
          const fetchedHandles = new Set(
            mapped.map((m) => m.handle.toLowerCase()),
          );
          const preserved = prev.filter(
            (x) => !fetchedHandles.has(x.handle.toLowerCase()),
          );
          return sortByProgressDesc([...preserved, ...mapped]);
        });
      } catch {
        // ignore; UI will remain empty, add form still works
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProphet = React.useCallback(
    (rawHandle: string): { error?: string } => {
      const v = validateHandleInput(rawHandle);
      if (v.error) return { error: v.error };
      const core = v.core ?? normalizeHandle(rawHandle);
      if (!core) return { error: "Please enter a valid @username" };
      const handle = `@${core}`;
      if (
        prophets.some((p) => p.handle.toLowerCase() === handle.toLowerCase())
      ) {
        return { error: "This prophet already exists" };
      }
      const p: Prophet = {
        name: titleFromHandle(core),
        handle,
        twitterUrl: `https://twitter.com/${core}`,
        imageSrc:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReQyGbfF6C-eWeXnIy33IEo2nDtJj5Od5Ygw&s",
        followers: 0,
        tweetsCurrent: 0,
        tweetsTotal: 0,
        collectionProgress: 0,
      };
      setProphets((prev) => sortByProgressDesc([...prev, p]));
      return {};
    },
    [prophets, sortByProgressDesc],
  );

  return { prophets, addProphet };
}
