"use client";

import Link from "next/link";
import { ArrowRight, Grid2X2 } from "lucide-react";

import { Label } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { CopySquareButton } from "./copy-square-button";
import { DelegateModuleWeight } from "./delegate-module-weight";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string; // SS58.1
  percentage?: number;
}

export function AgentCard(props: AgentCardProps) {
  const { delegatedAgents } = useDelegateAgentStore();
  const isAgentDelegated = delegatedAgents.some((m) => m.id === props.id);

  return (
    <div
      className={`flex min-w-full flex-col gap-2 border p-6 text-gray-400 ${isAgentDelegated ? "border-green-500/80 bg-green-500/10" : "border-white/20 bg-[#898989]/5"}`}
    >
      <div className="flex w-full items-center justify-between">
        <h2
          className={`text-xl font-semibold ${isAgentDelegated ? "text-green-500" : "text-white"}`}
        >
          {props.name}
        </h2>
        {props.percentage && (
          <Label className="text-sm font-semibold text-white">
            {props.percentage}%
          </Label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex w-full items-center gap-1 border border-white/20 bg-[#898989]/5 py-2 pl-2 backdrop-blur-md md:text-sm 2xl:text-base">
          <Grid2X2 className="h-6 w-6 text-green-500" />{" "}
          {smallAddress(String(props.agentKey))}
        </span>
        <CopySquareButton address={props.agentKey} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <DelegateModuleWeight
          id={props.id}
          name={props.name}
          agentKey={props.agentKey}
        />
        <Link
          className="flex w-full items-center justify-between border border-white/20 bg-[#898989]/5 p-2 pl-3 text-white backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/10"
          href={`agent/${props.agentKey}`}
        >
          View More <ArrowRight className="h-5 w-5 text-green-500" />
        </Link>
      </div>
    </div>
  );
}
