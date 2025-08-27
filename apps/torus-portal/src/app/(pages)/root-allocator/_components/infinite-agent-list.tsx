"use client";

import { useEffect, useRef } from "react";

import type { RouterOutputs } from "@torus-ts/api";
import { AgentItemSkeleton } from "@torus-ts/ui/components/agent-card/agent-card-skeleton-loader";

import { api } from "~/trpc/react";

import { AgentCard } from "./agent-card";

type InfiniteAgentData = RouterOutputs["agent"]["infinite"];
type AgentType = InfiniteAgentData["agents"][number];

interface InfiniteAgentListProps {
  search?: string | null;
  orderBy?:
    | "createdAt.desc"
    | "createdAt.asc"
    | "emission.desc"
    | "emission.asc"
    | undefined;
  isWhitelisted?: boolean;
}

export function InfiniteAgentList({
  search = undefined,
  orderBy,
  isWhitelisted,
}: InfiniteAgentListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = api.agent.infinite.useInfiniteQuery(
    {
      limit: 9,
      search: search ?? undefined,
      orderBy,
      isWhitelisted,
    },
    {
      getNextPageParam: (lastPage: InfiniteAgentData) => lastPage.nextCursor,
    },
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "100px", // Load more when user is 100px from the bottom
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <AgentItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full justify-center py-8">
        <p className="text-red-500">Error loading agents: {error.message}</p>
      </div>
    );
  }

  const agents: AgentType[] =
    data?.pages.flatMap((page: InfiniteAgentData) => page.agents) ?? [];

  if (agents.length === 0) {
    return (
      <div className="flex w-full justify-center py-8">
        <p className="text-zinc-400">No agents found.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent: AgentType, index: number) => (
          <AgentCard
            id={agent.id}
            key={`${agent.id}-${agent.key}-${index}`}
            name={agent.name ?? "<MISSING_NAME>"}
            agentKey={agent.key}
            metadataUri={agent.metadataUri}
            weightFactor={agent.weightFactor}
            registrationBlock={agent.registrationBlock}
            percComputedWeight={agent.percComputedWeight}
            isWhitelisted={agent.isWhitelisted ?? false}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {isFetchingNextPage && (
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AgentItemSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-4">
        {!hasNextPage && agents.length > 0 && (
          <div className="flex justify-center">
            <p className="text-zinc-400">You've reached the end</p>
          </div>
        )}
      </div>
    </div>
  );
}
