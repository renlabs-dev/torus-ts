"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import PortalFormContainer from "~/app/_components/portal-form-container";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { useAccountEmissions } from "~/hooks/use-account-emissions";

import AllSignalsView from "./_components/all-signals-view";
import DeletedSignalsView from "./_components/deleted-signals-view";
import FulfilledSignalsView from "./_components/fulfilled-signals-view";

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState("all");

  // Test account - you can change this to any account ID
  const testAccountId = "5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt";

  const emissions = useAccountEmissions({
    accountId: testAccountId,
    weightFactor: 0, // No penalty for testing
  });

  return (
    <PortalFormContainer>
      <PortalFormHeader
        title="Demand Signals"
        description="View and manage network demand signals."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Active</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AllSignalsView />
        </TabsContent>
        <TabsContent value="fulfilled">
          <FulfilledSignalsView />
        </TabsContent>
        <TabsContent value="deleted">
          <DeletedSignalsView />
        </TabsContent>
      </Tabs>
    </PortalFormContainer>
  );
}
