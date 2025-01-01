"use client";

import { Anvil, ArrowRight, Crown, Globe } from "lucide-react";
import { Button, CopyButton, Label } from "@torus-ts/ui";
import { DelegateModuleWeight } from "./delegate-module-weight";
import { smallAddress } from "@torus-ts/utils/subspace";
import { toast } from "@torus-ts/toast-provider";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import Link from "next/link";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string; // SS58.1
  percentage?: number | null;
  isDelegated?: boolean;
  globalWeightPerc?: number;
}

export function AgentItem(props: AgentCardProps) {
  const { delegatedAgents } = useDelegateAgentStore();
  const isAgentDelegated = delegatedAgents.some(
    (m) => m.address === props.agentKey,
  );

  return (
    <div
      className={`flex min-w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 md:flex-col md:items-start md:gap-4 lg:flex-row lg:items-center lg:gap-6 ${isAgentDelegated ? "text-green-500/80" : "text-foreground-muted"} animate-fade border-t py-4 last:border-b`}
    >
      <h2
        className={`line-clamp-1 w-full max-w-fit text-ellipsis text-base font-semibold ${isAgentDelegated ? "text-green-500/80" : "text-white"}`}
      >
        {props.name}
      </h2>

      <div className="flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:justify-between sm:gap-3 md:flex-row lg:justify-end lg:gap-4">
        <div className="flex flex-row-reverse items-center gap-3 sm:ml-auto sm:flex-row md:ml-0 md:flex-row-reverse lg:flex-row">
          <Label
            className={`flex items-center gap-1.5 text-base font-semibold ${(props.percentage ?? 0) > 0 ? "opacity-100" : "opacity-0"}`}
          >
            <Anvil size={16} />
            {props.percentage}%
          </Label>
          {(props.globalWeightPerc ?? 0) > 0 && (
            <Label className="flex items-center gap-1.5 text-base font-semibold">
              <Globe size={16} />
              {props.globalWeightPerc}%
            </Label>
          )}
          <CopyButton
            variant="link"
            copy={props.agentKey}
            notify={() => toast.success("Copied to clipboard")}
            className={`flex items-center gap-1.5 px-0 ${isAgentDelegated ? "text-green-500/80" : "text-foreground-muted"} hover:text-muted-foreground hover:no-underline`}
          >
            <Crown className="h-6 w-6" />
            <span>{smallAddress(props.agentKey, 6)}</span>
          </CopyButton>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-fit">
          <DelegateModuleWeight
            id={props.id}
            name={props.name}
            agentKey={props.agentKey}
            className="!w-1/2 sm:!w-fit"
          />

          <Button
            asChild
            variant="outline"
            className="w-1/2 text-white sm:w-fit"
          >
            <Link href={`agent/${props.agentKey}`}>
              View <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
