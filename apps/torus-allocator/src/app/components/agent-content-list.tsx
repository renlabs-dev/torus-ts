"use client";

import { AgentItem } from "./agent-item";
import { AgentsTabView } from "./agents-tab-view";
import { api } from "~/trpc/react";
import { FilterContent } from "./filter-content";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useSearchParams } from "next/navigation";
import { UserWeightInfo } from "./user-weight-info";

interface Agent {
  id: number;
  name: string | null;
  key: string | null;
  metadataUri: string | null;
  isDelegated: boolean;
  percentage: number;
  registrationBlock: number | null;
  globalWeightPerc?: number;
  // globalWeightStaked: number;
}

const filterAgentsBySearch = (agents: Agent[], searchTerm: string | null) => {
  if (!searchTerm) return agents;

  const search = searchTerm.toLowerCase();
  return agents.filter(
    (agent) =>
      (agent.name?.toLowerCase() ?? "").includes(search) ||
      (agent.key?.toLowerCase() ?? "").includes(search),
  );
};

export function AgentContentList() {
  const searchParams = useSearchParams();

  const { data: computedWeightedAgents } =
    api.computedAgentWeight.all.useQuery();

  const { delegatedAgents } = useDelegateAgentStore();
  const { data: agents, isLoading: isLoadingAgents } = api.agent.all.useQuery();

  const viewType = searchParams.get("view-type");
  const search = searchParams.get("search");

  const prepareAgentsList = (searchTerm: string | null = null) => {
    if (isLoadingAgents || !agents) return [];

    const agentsList = agents.map((agent) => {
      const delegated = delegatedAgents.find((d) => d.address === agent.key);
      const globalWeight = computedWeightedAgents?.find(
        (d) => d.agentKey === agent.key,
      );

      return {
        ...agent,
        isDelegated: !!delegated,
        percentage: delegated?.percentage ?? 0,
        registrationBlock: agent.registrationBlock,
        globalWeightPerc: globalWeight?.percComputedWeight ?? 0,
      };
    });

    return filterAgentsBySearch(agentsList, searchTerm);
  };

  const renderAgentItems = (agentsList: Agent[]) => {
    return agentsList.map((agent: Agent) => (
      <AgentItem
        id={agent.id}
        key={agent.id}
        name={agent.name ?? "<MISSING_NAME>"}
        agentKey={agent.key ?? "<MISSING_KEY>"}
        metadataUri={agent.metadataUri}
        registrationBlock={agent.registrationBlock}
        isDelegated={agent.isDelegated}
        percentage={agent.percentage}
        globalWeightPerc={agent.globalWeightPerc}
      />
    ));
  };

  const renderAllAgentsView = () => {
    if (isLoadingAgents) return <p>Loading... </p>;
    const allAgentsList = prepareAgentsList(search);
    if (allAgentsList.length === 0) return <p>No agents found.</p>;

    return renderAgentItems(allAgentsList);
  };

  const renderWeightedAgentsView = () => {
    if (isLoadingAgents) return <p>Loading... </p>;
    if (delegatedAgents.length === 0) return <p>No weighted agents found.</p>;

    const delegatedAgentsList = delegatedAgents.map((agent) => {
      const globalWeight = computedWeightedAgents?.find(
        (d) => d.agentKey === agent.address, // ?
      );
      return {
        ...agent,
        key: agent.address,
        isDelegated: true,
        percentage: agent.percentage,
        registrationBlock: agent.registrationBlock,
        globalWeightPerc: globalWeight?.percComputedWeight ?? 0,
      };
    });

    const filteredAgents = filterAgentsBySearch(delegatedAgentsList, search);
    if (filteredAgents.length === 0) return <p>No weighted agents found.</p>;

    return renderAgentItems(filteredAgents);
  };

  const renderPopularAgentsView = () => {
    if (isLoadingAgents) return <p>Loading... </p>;

    const allAgentsList = prepareAgentsList(search);
    if (allAgentsList.length === 0) return <p>No popular agents found.</p>;

    const sortedAgentsList = [...allAgentsList].sort(
      (a, b) => (b.globalWeightPerc ?? 0) - (a.globalWeightPerc ?? 0),
    );

    return renderAgentItems(sortedAgentsList);
  };

  const contentMap: Record<string, () => JSX.Element | JSX.Element[]> = {
    all: renderAllAgentsView,
    weighted: renderWeightedAgentsView,
    popular: renderPopularAgentsView,
  };

  const content =
    viewType && contentMap[viewType]
      ? contentMap[viewType]()
      : renderAllAgentsView();

  return (
    <div className="flex w-full flex-col">
      <div className="mb-6 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
        <FilterContent
          disabled={
            isLoadingAgents ||
            (viewType !== "weighted"
              ? agents?.length === 0
              : delegatedAgents.length === 0)
          }
        />
        <UserWeightInfo />
        <AgentsTabView />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{content}</div>
    </div>
  );
}
