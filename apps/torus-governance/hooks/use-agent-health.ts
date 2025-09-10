"use client";

import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";
import { api } from "~/trpc/react";
import { useMemo } from "react";

type AgentWithAggregatedPenalties = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["allWithAggregatedPenalties"]>
>;

export type PenaltyList = AgentWithAggregatedPenalties[number]["penalties"];

export interface DialogPenaltiesState {
  penalties: PenaltyList;
  agentName: string;
}

interface UseAgentHealthParams {
  searchParam?: string | null;
  statusFilter?: string | null;
}

export function useAgentHealth({
  searchParam = null,
  statusFilter = null,
}: UseAgentHealthParams = {}) {
  const { data: cadreListData } = api.cadre.all.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const { data: agentsWithPenalties, isFetching } =
    api.agent.allWithAggregatedPenalties.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  const penaltyThreshold = useMemo(
    () => Math.round(Math.sqrt(cadreListData?.length ?? 0)) + 1,
    [cadreListData?.length],
  );

  const filteredAgents = (() => {
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
  })();

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
