import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import DashboardTab from "./dashboard/dashboard";
import AgentHealthPage from "./agent-health/page";
import DaoApplicationsPage from "./dao-applications/page";

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
          <AgentHealthPage />
        </TabsContent>
        <TabsContent value="dao-member-applications">
          <DaoApplicationsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
