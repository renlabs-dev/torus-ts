"use client";

import type { ReactNode } from "react";

import type { inferProcedureOutput } from "@trpc/server";
import { Copy } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import type { AppRouter } from "@torus-ts/api";
import { Card, CardContent, CardTitle } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";

import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";

import { ReportAgent } from "./report-agent";
import { UpdateAgentButton } from "./update-agent-button/update-agent-button";

interface AgentInfoCardProps {
  agent: NonNullable<inferProcedureOutput<AppRouter["agent"]["byId"]>>;
}

interface LoadingValueProps {
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
}

interface AddressCopyButtonProps {
  text: string;
  label?: string;
}

interface DataFieldProps {
  label: string;
  children: ReactNode;
}

const LoadingValue = ({ isLoading, isError, children }: LoadingValueProps) => {
  if (isLoading) return <p className="animate-pulse text-sm">Loading...</p>;
  if (isError) return <>-</>;
  return <>{children}</>;
};

const AddressCopyButton = ({ text, label }: AddressCopyButtonProps) => (
  <CopyButton
    className="hover:text-muted-foreground h-fit p-0"
    variant="link"
    copy={text}
  >
    {label ?? smallAddress(text, 6)}
    <Copy className="h-4 w-4 ml-1" />
  </CopyButton>
);

const DataField = ({ label, children }: DataFieldProps) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}:</span>
    <span>{children}</span>
  </div>
);

export function AgentInfoCard({ agent }: AgentInfoCardProps) {
  const { isLoading, isError, displayTokensPerWeek, displayUsdValue } =
    useWeeklyUsdCalculation({
      agentKey: agent.key,
      weightFactor: agent.weightFactor,
    });

  return (
    <Card className="p-6">
      <CardTitle className="mb-6 flex flex-row items-center justify-between text-lg font-semibold">
        General Information
      </CardTitle>
      <CardContent className="flex w-full flex-col gap-2 px-0 pb-4">
        <DataField label="Agent Key">
          <AddressCopyButton text={agent.key} />
        </DataField>

        <DataField label="Name">{agent.name ?? "Loading"}</DataField>

        <DataField label="At Block">{agent.atBlock}</DataField>

        <DataField label="API Endpoint">
          {agent.apiUrl ? (
            <AddressCopyButton text={agent.apiUrl} label="Copy URL" />
          ) : (
            "N/A"
          )}
        </DataField>

        <DataField label="Weekly Rewards">
          <LoadingValue isLoading={isLoading} isError={isError}>
            {displayTokensPerWeek}
          </LoadingValue>
        </DataField>

        <DataField label="Weekly Rewards (USD)">
          <LoadingValue isLoading={isLoading} isError={isError}>
            {displayUsdValue}
          </LoadingValue>
        </DataField>
      </CardContent>
      <div className="flex flex-col space-y-2">
        <ReportAgent agentKey={agent.key} />
        <UpdateAgentButton agentKey={agent.key} />
      </div>
    </Card>
  );
}
