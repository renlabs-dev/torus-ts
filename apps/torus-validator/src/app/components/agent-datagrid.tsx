"use client";

import { toast } from "@torus-ts/toast-provider";
import { CopyButton, Card } from "@torus-ts/ui";
import { smallAddress, formatToken } from "@torus-ts/utils/subspace";
import { Copy } from "lucide-react";
import type { Agent } from "~/utils/types";

export function AgentDataGrid({ agent }: { agent: Agent }) {
  const dataGroups = [
    {
      title: "General Information",
      fields: [
        {
          label: "Agent Key",
          value: (
            <CopyButton
              className="h-6 p-0 hover:text-muted-foreground hover:no-underline"
              variant="link"
              copy={agent.key ?? ""}
              notify={() => toast.success("Copied to clipboard")}
            >
              {smallAddress(agent.key ?? "")}
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
      ],
    },
    {
      title: "Economic Parameters",
      fields: [
        { label: "Emission", value: formatToken(agent.totalStakers ?? 0) },
        // { label: "Incentive", value: formatToken(agent.incentive ?? 0) },
        // { label: "Dividend", value: formatToken(agent.dividend ?? 0) },
        // { label: "Delegation Fee", value: `${agent.delegationFee ?? 0}%` },
      ],
    },
    {
      title: "Staking Information",
      fields: [
        { label: "Total Staked", value: formatToken(agent.totalStaked ?? 0) },
        { label: "Total Stakers", value: agent.totalStakers ?? 0 },
        // {
        //   label: "Total Rewards",
        //   value: formatToken(agent.totalRewards ?? 0),
        // },
      ],
    },
  ];

  return (
    <div className="grid gap-6">
      {dataGroups.map((group, index) => (
        <Card key={index} className="p-6">
          <h3 className="mb-4 text-lg font-semibold">{group.title}</h3>
          <div className="grid gap-2">
            {group.fields.map((field, fieldIndex) => (
              <div
                key={fieldIndex}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground">{field.label}:</span>
                <span className="">{field.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
