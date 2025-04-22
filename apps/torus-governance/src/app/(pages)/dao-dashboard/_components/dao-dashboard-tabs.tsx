import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@torus-ts/ui/components/tabs";
import DashboardTab from "../dashboard/dashboard";

export function DaoDashboardTabs() {
  return (
    <Tabs defaultValue="dashboard" className="min-w-full w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="penalty">Penalty</TabsTrigger>
        <TabsTrigger value="dao-member-applications">
          DAO Member Applications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <DashboardTab />
      </TabsContent>{" "}
      <TabsContent value="penalty">asd</TabsContent>
      <TabsContent value="dao-member-applications">asd</TabsContent>
    </Tabs>
  );
}
