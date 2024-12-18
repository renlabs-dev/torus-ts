"use client";

import { ChartPie } from "lucide-react";

import { toast } from "@torus-ts/query-provider/use-toast";
import { useTorus } from "@torus-ts/torus-provider";

import { useDelegateSubnetStore } from "~/stores/delegateSubnetStore";

interface DelegateSubnetWeightProps {
  id: number;
  name: string;
  founderAddress: string;
}

export function DelegateSubnetWeight(props: DelegateSubnetWeightProps) {
  const { delegatedSubnets, addSubnet, removeSubnet } =
    useDelegateSubnetStore();

  const { selectedAccount } = useTorus();

  const isSubnetDelegated = delegatedSubnets.some((s) => s.id === props.id);

  const handleDelegateClick = () => {
    if (!selectedAccount?.address) {
      toast.error("Connect Wallet to delegate to a subnet.");
      return;
    }
    if (isSubnetDelegated) {
      removeSubnet(props.id);
    } else {
      addSubnet({
        id: props.id,
        name: props.name,
        founderAddress: props.founderAddress,
      });
    }
  };

  return (
    <button
      onClick={handleDelegateClick}
      className={`flex w-fit items-center gap-2 border border-white/20 bg-[#898989]/5 p-2 text-sm text-white backdrop-blur-md transition duration-200 ${
        isSubnetDelegated
          ? "hover:border-red-500 hover:bg-red-500/20"
          : "hover:border-cyan-500 hover:bg-cyan-500/10"
      }`}
    >
      <ChartPie
        className={`h-5 w-5 ${isSubnetDelegated ? "text-red-500" : "text-cyan-500"}`}
      />
      {isSubnetDelegated ? "Remove" : "Allocate"}
    </button>
  );
}
