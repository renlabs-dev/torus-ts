import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import DashboardTab from "./_components/dashboard-tab/dashboard";
import AgentHealthTab from "./_components/agent-health-tab/agent-health-tab";
import DaoApplicationsTab from "./_components/dao-applications-tab";

export default function DaoDashboardPage() {
  return (
    <div className="w-full animate-fade">
      <Tabs defaultValue="dashboard" className="min-w-full w-full">
        <TabsList className="grid w-full md:grid-cols-3 h-full">
          <TabsTrigger value="dashboard" className="min-w-full">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="agent-health" className="w-full">
            Agent Health
          </TabsTrigger>
          <TabsTrigger value="dao-member-applications" className="w-full">
            DAO Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="agent-health">
          <AgentHealthTab />
        </TabsContent>
        <TabsContent value="dao-member-applications">
          <DaoApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
