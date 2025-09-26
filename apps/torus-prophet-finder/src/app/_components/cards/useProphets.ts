"use client";

import { SAMPLE_PROPHETS } from "~/app/_components/cards/SampleProphets";
import { normalizeHandle } from "~/lib/handles/normalize-handle";
import { titleFromHandle } from "~/lib/handles/title-from-handle";
import type { Prophet } from "~/types/prophet";
import * as React from "react";

export function useProphets() {
  const [prophets, setProphets] = React.useState<Prophet[]>(SAMPLE_PROPHETS);

  const addProphet = React.useCallback(
    (rawHandle: string): { error?: string } => {
      const core = normalizeHandle(rawHandle);
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
      setProphets((prev) => [p, ...prev]);
      return {};
    },
    [prophets],
  );

  return { prophets, addProphet };
}
