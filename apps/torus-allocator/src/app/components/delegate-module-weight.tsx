"use client";

import { Button } from "@torus-ts/ui";
import { ChartPie } from "lucide-react";
import { toast } from "@torus-ts/toast-provider";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useTorus } from "@torus-ts/torus-provider";

interface DelegateModuleWeightProps {
  id: number;
  name: string;
  agentKey: string;
  className?: string;
}

export function DelegateModuleWeight(props: DelegateModuleWeightProps) {
  const { delegatedAgents, addAgent, removeAgent } = useDelegateAgentStore();

  const { selectedAccount } = useTorus();

  const isModuleDelegated = delegatedAgents.some(
    (m) => m.address === props.agentKey,
  );

  const handleDelegateClick = () => {
    if (!selectedAccount?.address) {
      toast.error("Connect Wallet to delegate to a subnet.");
      return;
    }
    if (isModuleDelegated) {
      removeAgent(props.agentKey);
    } else {
      addAgent({
        id: props.id,
        name: props.name,
        address: props.agentKey,
      });
    }
  };

  return (
    <Button
      onClick={handleDelegateClick}
      variant="outline"
      className={`flex w-fit items-center gap-2 bg-transparent text-white transition duration-200 ${props.className} ${isModuleDelegated ? "border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500" : "border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500"}`}
    >
      <ChartPie className={`h-6 w-6`} />
      {isModuleDelegated ? "Remove Allocation" : "Allocate to Agent"}
    </Button>
  );
}
