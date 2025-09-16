import { useTabWithQueryParam } from "hooks/use-tab-with-query-param";

import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import { env } from "~/env";

import AgentHealthTab from "./_components/agent-health-tab/agent-health-tab";
import DaoApplicationsTab from "./_components/dao-applications-tab";
import DashboardTab from "./_components/dashboard-tab/dashboard";

export function generateMetadata() {
  return createSeoMetadata({
    title: "DAO Dashboard - Torus Governance",
    description:
      "Monitor DAO operations, agent health, and root agent applications.",
    keywords: [
      "dao dashboard",
      "agent health",
      "dao applications",
      "governance monitoring",
      "network status",
    ],
    ogSiteName: "Torus Governance",
    canonical: "/dao-dashboard",
    baseUrl: env("BASE_URL"),
  });
}

export default function DaoDashboardPage() {
  const { tab, handleTabChange } = useTabWithQueryParam("dashboard");

  return (
    <div className="animate-fade w-full">
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="w-full min-w-full"
      >
        <TabsList className="grid h-full w-full md:grid-cols-3">
          <TabsTrigger value="dashboard" className="min-w-full">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="agent-health" className="w-full">
            Agent Health
          </TabsTrigger>
          <TabsTrigger value="dao-applications" className="w-full">
            DAO Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" key="dashboard-tab">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="agent-health" key="agent-health-tab">
          <AgentHealthTab />
        </TabsContent>
        <TabsContent value="dao-applications" key="dao-applications-tab">
          <DaoApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
