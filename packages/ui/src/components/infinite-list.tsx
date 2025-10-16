"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { cn } from "../lib/utils";

interface InfiniteListProps<TItem> {
  items: TItem[];
  renderItem: (item: TItem, index: number) => ReactNode;
  getItemKey: (item: TItem, index: number) => string | number;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  error?: Error | null;
  gridClassName?: string;
  containerClassName?: string;
  loadingComponent?: ReactNode;
  skeletonComponent?: ReactNode;
  skeletonCount?: number;
  emptyComponent?: ReactNode;
  errorComponent?: (error: Error) => ReactNode;
  endMessage?: ReactNode;
  rootMargin?: string;
}

/**
 * Generic infinite scroll list component with grid layout support.
 *
 * Handles loading states, errors, empty states, and automatic pagination
 * using Intersection Observer.
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
 *   api.agent.infinite.useInfiniteQuery(
 *     { limit: 9 },
 *     { getNextPageParam: (lastPage) => lastPage.nextCursor }
 *   );
 *
 * const agents = data?.pages.flatMap(page => page.agents) ?? [];
 *
 * <InfiniteList
 *   items={agents}
 *   renderItem={(agent) => <AgentCard {...agent} />}
 *   getItemKey={(agent) => agent.id}
 *   hasNextPage={hasNextPage}
 *   isFetchingNextPage={isFetchingNextPage}
 *   isLoading={isLoading}
 *   fetchNextPage={fetchNextPage}
 *   error={error}
 *   gridClassName="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
 *   skeletonComponent={<AgentSkeleton />}
 *   skeletonCount={9}
 * />
 * ```
 */
export function InfiniteList<TItem>({
  items,
  renderItem,
  getItemKey,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  error,
  gridClassName = "grid-cols-1",
  containerClassName,
  loadingComponent,
  skeletonComponent,
  skeletonCount = 9,
  emptyComponent,
  errorComponent,
  endMessage,
  rootMargin = "100px",
}: InfiniteListProps<TItem>) {
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
  });

  if (isLoading) {
    if (loadingComponent) return <>{loadingComponent}</>;

    if (skeletonComponent) {
      return (
        <div className={cn("flex w-full flex-col", containerClassName)}>
          <div className={cn("grid w-full gap-3", gridClassName)}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Fragment key={i}>{skeletonComponent}</Fragment>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-center py-8">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent(error)}</>;
    }

    return (
      <div className="flex w-full justify-center py-8">
        <p className="text-red-500">Error loading data: {error.message}</p>
      </div>
    );
  }

  if (items.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <div className="flex w-full justify-center py-8">
        <p className="text-zinc-400">No items found.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col", containerClassName)}>
      <div className={cn("grid w-full gap-3", gridClassName)}>
        {items.map((item, index) => (
          <Fragment key={getItemKey(item, index)}>
            {renderItem(item, index)}
          </Fragment>
        ))}
      </div>

      {isFetchingNextPage && skeletonComponent && (
        <div className={cn("mt-3 grid w-full gap-3", gridClassName)}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Fragment key={i}>{skeletonComponent}</Fragment>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-4">
        {!hasNextPage && items.length > 0 && (
          <div className="flex justify-center">
            {endMessage ?? (
              <p className="text-zinc-400">You've reached the end</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
