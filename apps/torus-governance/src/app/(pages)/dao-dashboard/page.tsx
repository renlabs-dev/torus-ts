"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import DashboardTab from "./_components/dashboard-tab/dashboard";
import AgentHealthTab from "./_components/agent-health-tab/agent-health-tab";
import DaoApplicationsTab from "./_components/dao-applications-tab";
import { useTabWithQueryParam } from "hooks/use-tab-with-query-param";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus DAO - Dashboard",
    description:
      "Monitor DAO performance, agent health, and review governance applications through the Torus Network DAO dashboard.",
    keywords: [
      "torus dashboard",
      "dao metrics",
      "agent health",
      "dao applications",
      "governance dashboard",
      "torus network statistics",
    ],
    ogSiteName: "Torus DAO",
    baseUrl: env("BASE_URL"),
    canonical: "/dao-dashboard",
  });

export default function DaoDashboardPage() {
  const { tab, handleTabChange } = useTabWithQueryParam("dashboard");

  return (
    <div className="w-full animate-fade">
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="min-w-full w-full"
      >
        <TabsList className="grid w-full md:grid-cols-3 h-full">
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
