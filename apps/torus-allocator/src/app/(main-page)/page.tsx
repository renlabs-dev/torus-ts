import { AgentItemCard } from "../_components/agent-item-card";
import { PaginationNav } from "../_components/pagination-nav";
import { api } from "~/trpc/server";

const ITEMS_PER_PAGE = 9;

async function FetchAgentItemCards({
  page = 1,
  search = undefined,
}: {
  page?: number;
  search?: string | null;
}) {
  const result = await api.agent.paginated({
    page,
    limit: ITEMS_PER_PAGE,
    search: search ?? undefined,
  });

  const { agents, pagination } = result;

  return (
    <div className="flex w-full flex-col">
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {agents.map((agent) => (
          <AgentItemCard
            id={agent.id}
            key={agent.id}
            name={agent.name ?? "<MISSING_NAME>"}
            agentKey={agent.key}
            metadataUri={agent.metadataUri}
            registrationBlock={agent.registrationBlock}
            networkAllocation={agent.percComputedWeight}
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

export default function Page({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const pageParam = searchParams.page;
  const page = pageParam ? parseInt(pageParam) : 1;

  const search = searchParams.search ?? null;

  return <FetchAgentItemCards page={page} search={search} />;
}
