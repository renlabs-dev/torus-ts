import { api } from "~/trpc/server";
import { AgentCard } from "./agent-card/agent-card";
import { PaginationNav } from "./pagination-nav";

export const ITEMS_PER_PAGE = 9;

interface FetchAgentCardsProps {
  page?: number;
  search?: string | null;
  orderBy?: "createdAt.desc" | undefined;
}

export async function AgentList({
  page = 1,
  search = undefined,
  orderBy,
}: FetchAgentCardsProps) {
  const result = await api.agent.paginated({
    page,
    limit: ITEMS_PER_PAGE,
    search: search ?? undefined,
    orderBy,
  });

  const { agents, pagination } = result;

  return (
    <div className="flex w-full flex-col">
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            id={agent.id}
            key={agent.id}
            name={agent.name ?? "<MISSING_NAME>"}
            agentKey={agent.key}
            metadataUri={agent.metadataUri}
            weightFactor={agent.weightFactor}
            registrationBlock={agent.registrationBlock}
            percComputedWeight={agent.percComputedWeight}
          />
        ))}
      </div>

      <PaginationNav
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        search={search}
      />
    </div>
  );
}
