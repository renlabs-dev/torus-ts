"use client";

import { useWeeklyUsdCalculation } from "../../../../../hooks/use-weekly-usd";
import { ReportAgent } from "./report-agent";
import { Card, CardContent, CardTitle } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Copy } from "lucide-react";
import type { Agent } from "~/utils/types";

export function AgentInfoCard({ agent }: Readonly<{ agent: Agent }>) {
  const { isLoading, isError, displayTokensPerWeek, displayUsdValue } =
    useWeeklyUsdCalculation({
      agentKey: agent.key,
      weightFactor: agent.weightFactor,
    });

  // Error SAFE - If the data is not loaded, display a loading state
  const showTokensPerWeek = isLoading ? (
    <p className="animate-pulse text-sm">Loading...</p>
  ) : isError ? (
    "-"
  ) : (
    displayTokensPerWeek
  );
  const showUsdValue = isLoading ? (
    <p className="animate-pulse text-sm">Loading...</p>
  ) : isError ? (
    "-"
  ) : (
    displayUsdValue
  );

  const dataGroups = [
    {
      label: "Agent Key",
      value: (
        <CopyButton
          className="hover:text-muted-foreground h-fit p-0"
          variant="link"
          copy={agent.key}
        >
          {smallAddress(agent.key, 6)}
          <Copy />
        </CopyButton>
      ),
    },
    { label: "Name", value: agent.name ?? "Loading" },
    { label: "At Block", value: agent.atBlock },
    // {
    //   label: "Registration Block",
    //   value: agent.registrationBlock ?? "Loading",
    // },
    {
      label: "API Endpoint",
      value: agent.apiUrl ? (
        <CopyButton
          className="hover:text-muted-foreground h-fit p-0"
          variant="link"
          copy={agent.apiUrl}
        >
          Copy URL
          <Copy />
        </CopyButton>
      ) : (
        "N/A"
      ),
    },
    // {
    //   label: "Weight Factor",
    //   value: agent.weightFactor ?? "N/A",
    // },
    {
      label: "Weekly Rewards",
      value: showTokensPerWeek,
    },
    {
      label: "Weekly Rewards(USD)",
      value: showUsdValue,
    },
  ];

  return (
    <Card className="p-6">
      <CardTitle className="mb-6 flex flex-row items-center justify-between text-lg font-semibold">
        General Information
      </CardTitle>
      <CardContent className="flex w-full flex-col gap-2 px-0 pb-4">
        {dataGroups.map((field) => (
          <div key={field.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{field.label}:</span>
            <span className="">{field.value}</span>
          </div>
        ))}
      </CardContent>
      <ReportAgent agentKey={agent.key} />
    </Card>
  );
}
