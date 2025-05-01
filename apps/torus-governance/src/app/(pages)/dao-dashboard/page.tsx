'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import DashboardTab from "./_components/dashboard-tab/dashboard";
import AgentHealthTab from "./_components/agent-health-tab/agent-health-tab";
import DaoApplicationsTab from "./_components/dao-applications-tab";
import { useTabWithQueryParam } from "./_hooks/use-tab-with-query-param";

export default function DaoDashboardPage() {
  const { tab, handleTabChange } = useTabWithQueryParam('dashboard');

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

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="agent-health">
          <AgentHealthTab />
        </TabsContent>
        <TabsContent value="dao-applications">
          <DaoApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
