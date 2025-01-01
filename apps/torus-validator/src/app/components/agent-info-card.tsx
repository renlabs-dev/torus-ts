"use client";

import { Copy } from "lucide-react";
import { CopyButton, Card, CardTitle, CardContent } from "@torus-ts/ui";
import { ReportAgent } from "./report-agent";
import { smallAddress, formatToken } from "@torus-ts/utils/subspace";
import { toast } from "@torus-ts/toast-provider";
import type { Agent } from "~/utils/types";

export function AgentInfoCard({ agent }: { agent: Agent }) {
  const dataGroups = [
    {
      label: "Agent Key",
      value: (
        <CopyButton
          className="h-6 p-0 hover:text-muted-foreground hover:no-underline"
          variant="link"
          copy={agent.key ?? ""}
          notify={() => toast.success("Copied to clipboard")}
        >
          {smallAddress(agent.key ?? "", 6)}
          <Copy className="hover:text-yellow-400" />
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
          className="h-6 p-0 hover:text-muted-foreground"
          variant="link"
          copy={agent.apiUrl}
          notify={() => toast.success("Copied to clipboard")}
        >
          Copy URL
          <Copy className="hover:text-yellow-400" />
        </CopyButton>
      ) : (
        "N/A"
      ),
    },
    {
      label: "Weight Factor",
      value: agent.weightFactor ?? "N/A",
    },
    { label: "Total Staked", value: formatToken(agent.totalStaked ?? 0) },
    { label: "Total Stakers", value: agent.totalStakers ?? 0 },
  ];

  return (
    <Card className="p-6">
      <CardTitle className="mb-6 flex flex-row items-center justify-between text-lg font-semibold">
        General Information
        <ReportAgent agentKey={agent.key ?? ""} />
      </CardTitle>
      <CardContent className="flex flex-col gap-2 px-0 pb-0">
        {dataGroups.map((field, fieldIndex) => (
          <div key={fieldIndex} className="flex items-center justify-between">
            <span className="text-muted-foreground">{field.label}:</span>
            <span className="">{field.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
