"use client";

import { api } from "~/trpc/react";
import { useMultipleAccountEmissions } from "~/hooks/use-multiple-account-emissions";

import { AgentCard } from "./agent-card";
import { PaginationNav } from "./pagination-nav";

export const ITEMS_PER_PAGE = 9;

interface FetchAgentCardsProps {
  page?: number;
  search?: string | null;
  orderBy?: "createdAt.desc" | undefined;
  isWhitelisted?: boolean;
}

export function AgentList({
  page = 1,
  search = undefined,
  orderBy,
  isWhitelisted = true,
}: FetchAgentCardsProps) {
  const { data: result, isLoading } = api.agent.paginated.useQuery({
    page,
    limit: ITEMS_PER_PAGE,
    search: search ?? undefined,
    orderBy,
    isWhitelisted,
  });

  const agents = result?.agents ?? [];
  const pagination = result?.pagination ?? { currentPage: 1, totalPages: 1 };

  // Extract agent keys and weight factors for batch emissions query
  const agentKeys = agents.map(agent => agent.key);
  const weightFactors = agents.reduce((acc, agent) => {
    acc[agent.key] = agent.weightFactor;
    return acc;
  }, {} as Record<string, number | null>);

  // Get batch emissions data
  const emissionsData = useMultipleAccountEmissions({
    accountIds: agentKeys,
    weightFactors,
  });

  if (isLoading) {
    return (
      <div className="flex w-full flex-col">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const emissionData = emissionsData[agent.key];
          return (
            <AgentCard
              id={agent.id}
              key={agent.id}
              name={agent.name ?? "<MISSING_NAME>"}
              agentKey={agent.key}
              metadataUri={agent.metadataUri}
              weightFactor={agent.weightFactor}
              registrationBlock={agent.registrationBlock}
              percComputedWeight={agent.percComputedWeight}
              isWhitelisted={agent.isWhitelisted ?? false}
              emissionData={emissionData}
            />
          );
        })}
      </div>

      <PaginationNav
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
