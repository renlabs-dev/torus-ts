import { PageContainer } from "~/app/_components/page-container";
import { FilterContent } from "../../_components/filter-content";
import { ListAgents } from "./_components/list-agents";

export default function AgentsPage() {
  return (
    <PageContainer
      pageHeader={
        <FilterContent
          placeholder="Search agents..."
          statusParamName="status"
        />
      }
      pageContent={<ListAgents />}
      displayShapeNetworkModal
    />
  );
}
