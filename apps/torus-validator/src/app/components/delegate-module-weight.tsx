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
      className={`flex w-fit items-center gap-2 text-white ${props.className}`}
    >
      <ChartPie className={`h-6 w-6`} />
      {isModuleDelegated ? "Remove" : "Select"}
    </Button>
  );
}
