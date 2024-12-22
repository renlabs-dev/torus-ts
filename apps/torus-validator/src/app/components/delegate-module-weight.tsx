"use client";

import { ChartPie } from "lucide-react";

import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

interface DelegateModuleWeightProps {
  id: number;
  name: string;
  agentKey: string;
}

export function DelegateModuleWeight(props: DelegateModuleWeightProps) {
  const { delegatedAgents, addAgent, removeAgent } = useDelegateAgentStore();

  const { selectedAccount } = useTorus();

  const isModuleDelegated = delegatedAgents.some((m) => m.id === props.id);

  const handleDelegateClick = () => {
    if (!selectedAccount?.address) {
      toast.error("Connect Wallet to delegate to a subnet.");
      return;
    }
    if (isModuleDelegated) {
      removeAgent(props.id);
    } else {
      addAgent({
        id: props.id,
        name: props.name,
        address: props.agentKey,
      });
    }
  };

  return (
    <button
      onClick={handleDelegateClick}
      className={`flex w-fit items-center gap-2 border border-white/20 bg-[#898989]/5 p-2 text-white backdrop-blur-md transition duration-200 ${
        isModuleDelegated
          ? "hover:border-red-500 hover:bg-red-500/20"
          : "hover:border-green-500 hover:bg-green-500/10"
      }`}
    >
      <ChartPie
        className={`h-6 w-6 ${isModuleDelegated ? "text-red-500" : "text-green-500"}`}
      />
      {isModuleDelegated ? "Remove" : "Allocate"}
    </button>
  );
}
