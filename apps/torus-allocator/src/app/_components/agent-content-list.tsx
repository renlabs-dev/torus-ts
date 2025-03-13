"use client";

import { AgentItem } from "./agent-item";
import { AgentItemSkeleton } from "./agent-item-skeleton";
import { AgentsTabView } from "./agents-tab-view";
import { FilterContent } from "./filter-content";
import { CustomPagination } from "./pagination-controls";
import { useRouter, useSearchParams } from "next/navigation";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";

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

const ITEMS_PER_PAGE = 9;

export function AgentContentList() {
  const searchParams = useSearchParams();

  const { data: computedWeightedAgents } =
    api.computedAgentWeight.all.useQuery();

  const { delegatedAgents } = useDelegateAgentStore();
  const { data: agents, isLoading: isLoadingAgents } = api.agent.all.useQuery();

  const viewType = searchParams.get("view-type");
  const search = searchParams.get("search");

  const router = useRouter();

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

  const currentPage = Number(searchParams.get("page")) || 1;

  const paginateAgents = (agentsList: Agent[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return agentsList.slice(startIndex, endIndex);
  };

  const renderPagination = (totalItems: number) => {
    return (
      <CustomPagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        search={search}
        viewType={viewType}
        onPageChange={(page: number) => {
          const searchParam = search ? "&search=" + search : "";
          const viewTypeParam = viewType ? "&view-type=" + viewType : "";
          router.push("?page=" + page + searchParam + viewTypeParam);
        }}
      />
    );
  };

  const renderAgentItems = (agentsList: Agent[]) => {
    if (agentsList.length === 0) return <p>No agents found.</p>;
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

  const renderSkeletons = () => {
    return (
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        <AgentItemSkeleton />
        <AgentItemSkeleton />
        <AgentItemSkeleton />
      </div>
    );
  };

  const renderAllAgentsView = () => {
    if (isLoadingAgents) return renderSkeletons();
    const allAgentsList = prepareAgentsList(search);
    const paginatedAgents = paginateAgents(allAgentsList);

    return (
      <div className="flex w-full flex-col">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          {renderAgentItems(paginatedAgents)}
        </div>

        {renderPagination(allAgentsList.length)}
      </div>
    );
  };

  const renderWeightedAgentsView = () => {
    if (isLoadingAgents) return renderSkeletons();
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
    const paginatedAgents = paginateAgents(filteredAgents);

    return (
      <div className="flex w-full flex-col">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          {renderAgentItems(paginatedAgents)}
        </div>

        {renderPagination(filteredAgents.length)}
      </div>
    );
  };

  const renderPopularAgentsView = () => {
    if (isLoadingAgents) return renderSkeletons();
    const allAgentsList = prepareAgentsList(search);
    if (allAgentsList.length === 0) return <p>No popular agents found.</p>;

    const sortedAgentsList = [...allAgentsList].sort(
      (a, b) => (b.globalWeightPerc ?? 0) - (a.globalWeightPerc ?? 0),
    );
    const paginatedAgents = paginateAgents(sortedAgentsList);

    return (
      <div className="flex w-full flex-col">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          {renderAgentItems(paginatedAgents)}
        </div>
        {renderPagination(sortedAgentsList.length)}
      </div>
    );
  };

  const contentMap: Record<string, () => JSX.Element | JSX.Element[]> = {
    all: renderAllAgentsView,
    weighted: renderWeightedAgentsView,
    popular: renderPopularAgentsView,
  };

  const content =
    viewType && contentMap[viewType]
      ? contentMap[viewType]()
      : renderPopularAgentsView();

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
        <AgentsTabView />
      </div>

      {content}
    </div>
  );
}
