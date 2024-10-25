"use client";

import { ChartPieIcon } from "@heroicons/react/24/outline";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";

import { useDelegateModuleStore } from "~/stores/delegateModuleStore";

interface DelegateModuleWeightProps {
  id: number;
  name: string;
  moduleKey: string;
}

export function DelegateModuleWeight(props: DelegateModuleWeightProps) {
  const { delegatedModules, addModule, removeModule } =
    useDelegateModuleStore();

  const { selectedAccount } = useTorus();

  const isModuleDelegated = delegatedModules.some((m) => m.id === props.id);

  const handleDelegateClick = () => {
    if (!selectedAccount?.address) {
      toast.error("Connect Wallet to delegate to a subnet.");
      return;
    }
    if (isModuleDelegated) {
      removeModule(props.id);
    } else {
      addModule({
        id: props.id,
        name: props.name,
        address: props.moduleKey,
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
      <ChartPieIcon
        className={`h-6 w-6 ${isModuleDelegated ? "text-red-500" : "text-green-500"}`}
      />
      {isModuleDelegated ? "Remove" : "Allocate"}
    </button>
  );
}
