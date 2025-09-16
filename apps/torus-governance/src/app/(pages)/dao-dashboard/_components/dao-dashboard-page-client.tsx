"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useTabWithQueryParam } from "hooks/use-tab-with-query-param";
import AgentHealthTab from "../_components/agent-health-tab/agent-health-tab";
import DaoApplicationsTab from "../_components/dao-applications-tab";
import DashboardTab from "../_components/dashboard-tab/dashboard";

const ALLOWED_TABS = ["dashboard", "agent-health", "dao-applications"] as const;
type AllowedTab = (typeof ALLOWED_TABS)[number];

export default function DaoDashboardPageClient() {
  const { tab: rawTab, handleTabChange } = useTabWithQueryParam(
    "dashboard",
    "/dao-dashboard",
  );

  // Normalize and validate the tab
  const tab: AllowedTab = ALLOWED_TABS.includes(rawTab as AllowedTab)
    ? (rawTab as AllowedTab)
    : "dashboard";

  const handleValidatedTabChange = (value: string) => {
    // Only call handleTabChange if the value is in the whitelist
    if (ALLOWED_TABS.includes(value as AllowedTab)) {
      handleTabChange(value);
    }
    // Ignore invalid values silently
  };

  return (
    <div className="animate-fade w-full">
      <Tabs
        value={tab}
        onValueChange={handleValidatedTabChange}
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
