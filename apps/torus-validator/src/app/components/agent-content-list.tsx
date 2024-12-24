"use client";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";
import { AllOrWeighted } from "./all-or-weighted";
import { AgentItem } from "./agent-item";
import { useSearchParams } from "next/navigation";
import { FilterContent } from "./filter-content";

// interface AgentCardProps {
//   id: number;
//   name: string;
//   agentKey: string; // SS58.1
//   percentage?: number | null;
//   isDelegated?: boolean;
// }

export function AgentContentList() {
  // const isAgentDelegated = delegatedAgents.some((m) => m.id === props.id);
  const searchParams = useSearchParams();

  const { delegatedAgents } = useDelegateAgentStore();
  const { data: agents, isLoading: isLoadingAgents } = api.agent.all.useQuery();

  const view = searchParams.get("view");
  if (view !== "agents") return null;

  const viewType = searchParams.get("view-type");

  const renderAllAgentsView = () => {
    if (isLoadingAgents) return <p>Loading... </p>;
    if (!agents) return <p>No agents found.</p>;

    const allAgentsList = agents.map((agent) => {
      const delegated = delegatedAgents.find((d) => d.address === agent.key);
      return {
        ...agent,
        isDelegated: !!delegated,
        percentage: delegated?.percentage ?? 0,
      };
    });

    const allAgents = allAgentsList.map((agent) => (
      <AgentItem
        id={agent.id}
        key={agent.id}
        name={agent.name ?? ""}
        isDelegated={agent.isDelegated}
        percentage={agent.percentage}
        agentKey={agent.key ?? ""}
      />
    ));

    return allAgents;
  };

  const renderWeighted = () => {
    if (isLoadingAgents) return <p>Loading... </p>;
    if (delegatedAgents.length === 0) return <p>No agents found.</p>;

    const delegatedAgenstList = delegatedAgents.map((agent) => {
      return {
        ...agent,
        isDelegated: true,
        percentage: agent.percentage,
      };
    });

    const allDelegatedAgents = delegatedAgenstList.map((agent) => (
      <AgentItem
        id={agent.id}
        key={agent.id}
        name={agent.name}
        isDelegated={agent.isDelegated}
        percentage={agent.percentage}
        agentKey={agent.address}
      />
    ));

    return allDelegatedAgents;
  };

  const content =
    viewType !== "weighted" ? renderAllAgentsView() : renderWeighted();

  return (
    <div className="flex w-full flex-col">
      <div className="mb-6 flex w-full flex-col items-center justify-between md:flex-row">
        <FilterContent
          disabled={
            isLoadingAgents ||
            (viewType !== "weighted"
              ? agents?.length === 0
              : delegatedAgents.length === 0)
          }
        />
        <AllOrWeighted />
      </div>
      {content}
    </div>
  );
}
