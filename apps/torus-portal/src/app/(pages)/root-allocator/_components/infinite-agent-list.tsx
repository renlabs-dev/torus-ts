"use client";

import type { RouterOutputs } from "@torus-ts/api";
import { AgentItemSkeleton } from "@torus-ts/ui/components/agent-card/agent-card-skeleton-loader";
import { InfiniteList } from "@torus-ts/ui/components/infinite-list";
import { api } from "~/trpc/react";
import { useEffect, useMemo } from "react";
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

  // Fetch agent connection counts for displaying subagent/parent counts
  const { data: connectionCounts } = api.agent.agentConnectionCounts.useQuery();

  // Log error to console and treat as empty list
  useEffect(() => {
    if (error) {
      console.error("Error loading agents:", error.message);
    }
  }, [error]);

  const agents: AgentType[] =
    data?.pages.flatMap((page: InfiniteAgentData) => page.agents) ?? [];

  // Create lookup function for subagent counts
  const getSubagentCount = useMemo(() => {
    if (!connectionCounts) return (_key: string) => undefined;
    return (agentKey: string) => connectionCounts.subagentCounts[agentKey];
  }, [connectionCounts]);

  return (
    <InfiniteList
      items={agents}
      renderItem={(agent: AgentType) => (
        <AgentCard
          id={agent.id}
          name={agent.name ?? "<MISSING_NAME>"}
          agentKey={agent.key}
          metadataUri={agent.metadataUri}
          weightFactor={agent.weightFactor}
          registrationBlock={agent.registrationBlock}
          percComputedWeight={agent.percComputedWeight}
          isWhitelisted={agent.isWhitelisted ?? false}
          subagentCount={getSubagentCount(agent.key)}
        />
      )}
      getItemKey={(agent: AgentType, index: number) =>
        `${agent.id}-${agent.key}-${index}`
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      fetchNextPage={() => void fetchNextPage()}
      error={null}
      gridClassName="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      skeletonComponent={<AgentItemSkeleton />}
      skeletonCount={9}
      emptyComponent={
        <div className="flex w-full justify-center py-8">
          <p className="text-zinc-400">No agents found.</p>
        </div>
      }
    />
  );
}
