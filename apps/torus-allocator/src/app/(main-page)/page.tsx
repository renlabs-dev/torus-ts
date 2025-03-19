import { AgentItemCard } from "../_components/agent-item-card";
import { Filter } from "../_components/filter-content";
import { PaginationNav } from "../_components/pagination-nav";
import { ViewSelector } from "../_components/view-selector";
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
            weightFactor={agent.weightFactor}
            registrationBlock={agent.registrationBlock}
            globalWeightPerc={agent.percComputedWeight}
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

export default async function Page(props: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const pageParam = searchParams.page;
  const page = pageParam ? parseInt(pageParam) : 1;
  const search = searchParams.search ?? null;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
        <Filter defaultValue={search ?? ""} />
        <ViewSelector />
      </div>

      <FetchAgentItemCards page={page} search={search} />
    </div>
  );
}
