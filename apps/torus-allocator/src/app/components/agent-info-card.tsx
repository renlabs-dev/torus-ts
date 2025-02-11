"use client";

import { toast } from "@torus-ts/toast-provider";
import { Card, CardContent, CardTitle, CopyButton } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Copy } from "lucide-react";
import type { Agent } from "~/utils/types";
import { ReportAgent } from "./report-agent";

export function AgentInfoCard({ agent }: Readonly<{ agent: Agent }>) {
  const dataGroups = [
    {
      label: "Agent Key",
      value: (
        <CopyButton
          className="h-fit p-0 hover:text-muted-foreground"
          variant="link"
          copy={agent.key}
          notify={() => toast.success("Copied to clipboard")}
        >
          {smallAddress(agent.key, 6)}
          <Copy />
        </CopyButton>
      ),
    },
    { label: "Name", value: agent.name ?? "N/A" },
    { label: "At Block", value: agent.atBlock },
    {
      label: "Registration Block",
      value: agent.registrationBlock ?? "N/A",
    },
    {
      label: "API Endpoint",
      value: agent.apiUrl ? (
        <CopyButton
          className="h-fit p-0 hover:text-muted-foreground"
          variant="link"
          copy={agent.apiUrl}
          notify={() => toast.success("Copied to clipboard")}
        >
          Copy URL
          <Copy />
        </CopyButton>
      ) : (
        "N/A"
      ),
    },
    {
      label: "Weight Factor",
      value: agent.weightFactor ?? "N/A",
    },
    // { label: "Total Allocation", value: formatToken(agent.totalStaked ?? 0) },
    // { label: "Total Allocated users", value: agent.totalStakers ?? 0 },
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
