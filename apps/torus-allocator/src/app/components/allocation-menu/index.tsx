"use client";

import { AgentList } from "./components/agent-list";
import { AllocationActions } from "./components/allocation-actions";
import { getSubmitStatus } from "./components/get-submit-status";
import { MenuTrigger } from "./components/menu-trigger";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@torus-ts/ui/components/sheet";
import { useEffect, useState } from "react";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";

export function AllocationMenu() {
  const {
    hasPercentageChange,
    hasUnsavedChanges,
    getTotalPercentage,
    setDelegatedAgentsFromDB,
  } = useDelegateAgentStore();

  const { selectedAccount } = useTorus();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitStatus = getSubmitStatus({
    selectedAccount: selectedAccount?.address,
    totalPercentage: getTotalPercentage(),
    isSubmitting,
    hasUnsavedChanges,
    hasPercentageChange,
  });

  const { data: userAgentWeight, error: agentError } =
    api.userAgentWeight.byUserKey.useQuery(
      { userKey: selectedAccount?.address ?? "" },
      {
        enabled: !!selectedAccount?.address,
        staleTime: Infinity,
      },
    );

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && selectedAccount?.address && userAgentWeight) {
      const formattedModules = userAgentWeight.map((agent) => ({
        id: agent.user_agent_weight.id,
        address: agent.user_agent_weight.agentKey,
        title: agent.agent.name ?? "",
        name: agent.agent.name ?? "",
        percentage: agent.user_agent_weight.weight,
        registrationBlock: agent.agent.registrationBlock,
        metadataUri: agent.agent.metadataUri,
      }));

      setDelegatedAgentsFromDB(formattedModules);
      setHasInitialized(true);
    } else if (!selectedAccount?.address) {
      setDelegatedAgentsFromDB([]);
      setHasInitialized(false);
    }

    if (agentError) {
      console.error("Error fetching user agent data:", agentError);
    }
  }, [
    userAgentWeight,
    agentError,
    setDelegatedAgentsFromDB,
    selectedAccount,
    hasInitialized,
  ]);

  return (
    <Sheet>
      <MenuTrigger
        selectedAccount={selectedAccount?.address}
        submitStatus={submitStatus}
      />
      <SheetContent className="z-[70] flex h-full flex-col justify-between gap-8">
        <SheetHeader>
          <SheetTitle>Allocation Menu</SheetTitle>
        </SheetHeader>
        <AgentList />
        <AllocationActions />
      </SheetContent>
    </Sheet>
  );
}
