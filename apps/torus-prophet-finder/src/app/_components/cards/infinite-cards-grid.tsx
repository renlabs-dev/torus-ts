"use client";

import { InfiniteList } from "@torus-ts/ui/components/infinite-list";
import { ProfileCard } from "~/app/_components/profile-card";
import { ProfileCardSkeleton } from "~/app/_components/profile-card-skeleton";
import type { Prophet } from "~/types/prophet";
import { useEffect } from "react";
import { useProphetsInfinite } from "./use-prophets-infinite";

interface Props {
  search?: string;
  onAddProphet?: (raw: string) => Promise<string | null>;
  validateProphet?: (raw: string) => { error?: string; core?: string };
}

export default function InfiniteCardsGrid({ search }: Props) {
  const {
    prophets,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadInitial,
    loadMore,
  } = useProphetsInfinite({ search });

  // Load initial data on mount or when search changes
  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <InfiniteList
      items={prophets}
      renderItem={(prophet: Prophet) => (
        <ProfileCard key={prophet.handle} {...prophet} priority={false} />
      )}
      getItemKey={(prophet: Prophet) => prophet.handle}
      hasNextPage={hasMore}
      isFetchingNextPage={isLoadingMore}
      isLoading={isLoading}
      fetchNextPage={() => void loadMore()}
      error={error}
      gridClassName="grid-cols-1 sm:grid-cols-2 md:gap-8 lg:grid-cols-3"
      containerClassName="gap-6 sm:gap-7"
      skeletonComponent={<ProfileCardSkeleton />}
      skeletonCount={12}
      emptyComponent={
        <div className="flex w-full justify-center py-8">
          <p className="text-zinc-400">
            No prophets match your search. Try a different name or add a new
            prophet.
          </p>
        </div>
      }
      errorComponent={(err) => (
        <div className="flex w-full justify-center py-8">
          <p className="text-red-500">Error loading prophets: {err.message}</p>
        </div>
      )}
      endMessage={
        <p className="text-sm text-zinc-500">
          You've reached the end • {prophets.length} prophets
        </p>
      }
      rootMargin="200px"
    />
  );
}
