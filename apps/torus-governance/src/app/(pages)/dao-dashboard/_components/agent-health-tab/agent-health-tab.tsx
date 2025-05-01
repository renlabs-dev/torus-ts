import { PageContainer } from "~/app/_components/page-container";
import { FilterContent } from "~/app/_components/filter-content";
import { AgentHealthList } from "./_components/agent-health-list";

export default function AgentHealthTab() {
  return (
    <PageContainer
      pageHeader={
        <FilterContent
          placeholder="Search agents..."
          statusParamName="status"
          statusOptions={[
            { label: "All", value: "all" },
            { label: "Healthy", value: "healthy" },
            { label: "Penalized", value: "penalized" },
          ]}
        />
      }
      pageContent={<AgentHealthList />}
    />
  );
}
