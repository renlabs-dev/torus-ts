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

      {/* Test Emission Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agent Network Emission (Test)</CardTitle>
          <CardDescription>
            Account: {testAccountId.slice(0, 8)}...{testAccountId.slice(-6)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emissions.isLoading ? (
            <p className="text-muted-foreground">Loading emissions data...</p>
          ) : emissions.isError ? (
            <p className="text-destructive">Error loading emissions</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Total Agent Network Emission
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="font-mono">
                      {emissions.displayValues.rootEmission}
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span
                      className={`font-mono ${
                        emissions.emissions.streams.net.tokensPerWeek >= 0
                          ? "text-green-600"
                          : "text-red-600"
                        }`}
                    >
                      {emissions.emissions.streams.net.tokensPerWeek >= 0
                        ? "+"
                        : ""}
                      {emissions.displayValues.netStreams}
                    </span>
                    <span className="text-muted-foreground">=</span>
                  </div>
                  <p className="text-2xl font-bold text-center">
                    {emissions.displayValues.agentNetworkEmission}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {emissions.emissions.root.percentage.toFixed(4)}%
                    </span>
                    <span>+</span>
                    <span
                      className={
                        emissions.emissions.streams.net.percentage >= 0
                          ? ""
                          : "text-red-600"
                      }
                    >
                      {emissions.emissions.streams.net.percentage >= 0
                        ? ""
                        : ""}
                      {emissions.emissions.streams.net.percentage.toFixed(4)}%
                    </span>
                    <span>=</span>
                    <span className="font-semibold">
                      {emissions.emissions.total.percentage.toFixed(4)}% of
                      network
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Emission Sources</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Root Emission:</span>
                      <span className="font-mono">
                        {emissions.displayValues.rootEmission}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Network %:</span>
                      <span>
                        {emissions.emissions.root.percentage.toFixed(4)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Stream Activity</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        Incoming ({emissions.emissions.streams.incoming.count}{" "}
                        streams):
                      </span>
                      <span className="font-mono text-green-600">
                        +{emissions.displayValues.incomingStreams}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        Outgoing ({emissions.emissions.streams.outgoing.count}{" "}
                        streams):
                      </span>
                      <span className="font-mono text-red-600">
                        -{emissions.displayValues.outgoingStreams}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-1">
                      <span>Net Streams:</span>
                      <span
                        className={`font-mono ${
                          emissions.emissions.streams.net.tokensPerWeek >= 0
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {emissions.displayValues.netStreams}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {emissions.hasCalculatingStreams && (
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  ⏳ Some streams are still calculating. Values will update
                  automatically.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
