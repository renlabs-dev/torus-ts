"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@torus-ts/ui/components/sheet";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import useSubmitStore from "~/stores/submitStore";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { AllocationActions } from "./components/allocation-actions";
import { AllocationAgentList } from "./components/allocation-agent-list";
import { AllocationSheetTrigger } from "./components/allocation-sheet-trigger";
import { getSubmitStatus } from "./components/get-submit-status";

export function AllocationSheet() {
  const {
    hasPercentageChange,
    hasUnsavedChanges,
    getTotalPercentage,
    setDelegatedAgentsFromDB,
  } = useDelegateAgentStore();

  const { selectedAccount } = useTorus();

  const { isSubmitting } = useSubmitStore();

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
      const formattedModules = userAgentWeight.map((data) => ({
        id: data.user_agent_weight.id,
        address: data.user_agent_weight.agentKey,
        title: data.agent.name ?? "<MISSING_NAME>",
        name: data.agent.name ?? "<MISSING_NAME>",
        percentage: data.user_agent_weight.weight,
        registrationBlock: data.agent.registrationBlock,
        metadataUri: data.agent.metadataUri,
        percComputedWeight: data.computed_agent_weight?.percComputedWeight ?? 0,
        weightFactor: data.agent.weightFactor,
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

  const submitStatus = getSubmitStatus({
    selectedAccount: selectedAccount?.address,
    totalPercentage: getTotalPercentage(),
    isSubmitting,
    hasUnsavedChanges: hasUnsavedChanges(),
    hasPercentageChange,
  });

  return (
    <Sheet>
      <AllocationSheetTrigger
        selectedAccount={selectedAccount?.address}
        submitStatus={submitStatus}
      />
      <SheetContent className="z-[70] flex h-full flex-col justify-between gap-8">
        <SheetHeader>
          <SheetTitle>Allocation Menu</SheetTitle>
        </SheetHeader>

        <AllocationAgentList />

        <SheetFooter>
          <AllocationActions submitStatus={submitStatus} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
