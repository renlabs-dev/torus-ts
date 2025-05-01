"use client";

import { api } from "~/trpc/react";
import { useMemo } from "react";
import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";

export type AgentWithAggregatedPenalties = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["allWithAggregatedPenalties"]>
>;

export type PenaltyList = AgentWithAggregatedPenalties[number]["penalties"];

export interface DialogPenaltiesState {
  penalties: PenaltyList;
  agentName: string;
}

export interface UseAgentHealthParams {
  searchParam?: string | null;
  statusFilter?: string | null;
}

export function useAgentHealth({
  searchParam = null,
  statusFilter = null,
}: UseAgentHealthParams = {}) {
  const { data: cadreListData } = api.cadre.all.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  const { data: agentsWithPenalties, isFetching } =
    api.agent.allWithAggregatedPenalties.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    });

  // Calculate the penalty threshold based on the square root of cadre list length
  const penaltyThreshold = useMemo(
    () => Math.round(Math.sqrt(cadreListData?.length ?? 0)) + 1,
    [cadreListData?.length],
  );

  const filteredAgents = useMemo(() => {
    if (!agentsWithPenalties) return [];

    const search = searchParam ? searchParam.toLocaleLowerCase() : null;

    return agentsWithPenalties
      .map((agent) =>
        filterAgent({
          agent,
          search,
          statusFilter,
          penaltyThreshold,
        }),
      )
      .filter(
        (agent): agent is AgentWithAggregatedPenalties[number] =>
          agent !== null,
      );
  }, [agentsWithPenalties, searchParam, statusFilter, penaltyThreshold]);

  return {
    agentsWithPenalties,
    filteredAgents,
    penaltyThreshold,
    isFetching,
  };
}

function filterAgent({
  agent,
  search,
  statusFilter,
  penaltyThreshold,
}: {
  agent: AgentWithAggregatedPenalties[number];
  search: string | null;
  statusFilter: string | null;
  penaltyThreshold: number;
}): AgentWithAggregatedPenalties[number] | null {
  if (search) {
    const searchLower = search.toLocaleLowerCase();
    const agentKeyLower = agent.key.toLocaleLowerCase();
    const agentNameLower = (agent.name ?? "").toLocaleLowerCase();

    if (
      !agentNameLower.includes(searchLower) &&
      !agentKeyLower.includes(searchLower)
    ) {
      return null;
    }
  }

  if (statusFilter && statusFilter !== "all") {
    const isPenalized = agent.penalties.length >= penaltyThreshold;

    if (statusFilter === "healthy" && isPenalized) return null;
    if (statusFilter === "penalized" && !isPenalized) return null;
  }

  return agent;
}
