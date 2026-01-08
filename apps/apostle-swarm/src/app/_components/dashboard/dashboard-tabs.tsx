"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Suspense, useState } from "react";
import { ApostlesTable } from "./apostles-table";
import { CommunitySubmissionsTable } from "./community-submissions-table";
import { ProspectsTable } from "./prospects-table";

type TabValue = "prospects" | "submissions" | "apostles";

function DashboardTabsContent() {
  const [activeTab, setActiveTab] = useState<TabValue>("prospects");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
      <TabsList>
        <TabsTrigger value="prospects">Prospects</TabsTrigger>
        <TabsTrigger value="submissions">Community Submissions</TabsTrigger>
        <TabsTrigger value="apostles">Apostles</TabsTrigger>
      </TabsList>

      <TabsContent value="prospects">
        <ProspectsTable />
      </TabsContent>

      <TabsContent value="submissions">
        <CommunitySubmissionsTable />
      </TabsContent>

      <TabsContent value="apostles">
        <ApostlesTable />
      </TabsContent>
    </Tabs>
  );
}

export function DashboardTabs() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardTabsContent />
    </Suspense>
  );
}
