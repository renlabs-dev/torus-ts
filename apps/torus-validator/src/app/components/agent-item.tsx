"use client";

import Link from "next/link";
import { Anvil, ArrowRight, Crown, Percent } from "lucide-react";

import { Button, Label } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { DelegateModuleWeight } from "./delegate-module-weight";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string; // SS58.1
  percentage?: number | null;
  isDelegated?: boolean;
}

export function AgentItem(props: AgentCardProps) {
  const { delegatedAgents } = useDelegateAgentStore();
  const isAgentDelegated = delegatedAgents.some((m) => m.id === props.id);

  return (
    <div
      className={`flex min-w-full items-center justify-between gap-2 ${isAgentDelegated ? "text-green-500/80" : "text-foreground-muted"} animate-fade border-t py-4 last:border-b`}
    >
      <h2
        className={`text-base font-semibold ${isAgentDelegated ? "text-green-500/80" : "text-white"}`}
      >
        {props.name}
      </h2>

      <div className="flex items-center gap-4">
        {(props.percentage ?? 0) > 0 && (
          <Label className="flex items-center gap-1.5 text-base font-semibold">
            <Anvil size={16} />
            {props.percentage}%
          </Label>
        )}

        <Button
          variant="link"
          className={`flex items-center gap-1.5 px-0 ${isAgentDelegated ? "text-green-500/80" : "text-foreground-muted"}`}
        >
          <Crown className="h-6 w-6" />
          <span>{smallAddress(String(props.agentKey))}</span>
        </Button>

        <div className="flex items-center gap-2">
          <DelegateModuleWeight
            id={props.id}
            name={props.name}
            agentKey={props.agentKey}
          />

          <Link href={`agent/${props.agentKey}`}>
            <Button variant="outline" className="text-white">
              Expand <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
