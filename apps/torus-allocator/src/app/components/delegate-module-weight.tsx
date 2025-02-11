"use client";

import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui";
import { Anvil } from "lucide-react";
import { ALLOCATOR_ADDRESS } from "~/consts";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

interface DelegateModuleWeightProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
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
      toast.error("Connect Wallet to allocate to this agent.");
      return;
    }
    if (isModuleDelegated) {
      removeAgent(props.agentKey);
    } else {
      toast.success("Agent added, open allocation menu to set percentages.");
      addAgent({
        id: props.id,
        name: props.name,
        address: props.agentKey,
        metadataUri: props.metadataUri,
        registrationBlock: props.registrationBlock,
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDelegateClick}
      disabled={props.agentKey === ALLOCATOR_ADDRESS}
      className={`flex w-fit items-center gap-2 bg-transparent text-white transition duration-200 ${props.className} ${isModuleDelegated ? "border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500" : "border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-500"}`}
    >
      <Anvil className={"h-6 w-6"} />
      {isModuleDelegated ? "Remove Allocation" : "Allocate"}
    </Button>
  );
}
