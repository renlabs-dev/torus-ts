"use client";

import { PageContainer } from "~/app/_components/page-container";
import { FilterContent } from "~/app/_components/filter-content";
import { ListAgents } from "./_components/list-agents";

export default function AgentHealthPage() {
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
      pageContent={<ListAgents />}
    />
  );
}
