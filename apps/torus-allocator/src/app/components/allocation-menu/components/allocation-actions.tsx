"use client";

import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { SheetFooter } from "@torus-ts/ui/components/sheet";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { formatToken } from "@torus-ts/utils/subspace";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { env } from "~/env";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";

export function AllocationActions() {
  const {
    delegatedAgents,
    updatePercentage,
    getTotalPercentage,
    setPercentageChange,
    updateOriginalAgents,
    setDelegatedAgentsFromDB,
  } = useDelegateAgentStore();

  const router = useRouter();
  const { toast } = useToast();
  const { selectedAccount, api: torusApi } = useTorus();

  const totalPercentage = getTotalPercentage();

  const hasItemsToClear = delegatedAgents.length > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAutoCompletePercentage() {
    const items = delegatedAgents;

    const remainingPercentage = 100 - totalPercentage;
    const itemsToUpdate = items.length;

    if (itemsToUpdate === 0) return;

    const percentagePerItem = Math.floor(remainingPercentage / itemsToUpdate);
    const extraPercentage = remainingPercentage % itemsToUpdate;

    items.forEach((item, index) => {
      const newPercentage =
        item.percentage + percentagePerItem + (index < extraPercentage ? 1 : 0);
      updatePercentage(item.address, newPercentage);
    });
  }

  const accountStakedBy = useKeyStakedBy(
    torusApi,
    env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
  );

  const userStakeWeight = useMemo(() => {
    if (!accountStakedBy.data || !selectedAccount?.address) {
      return BigInt(0);
    }

    const stake = accountStakedBy.data.get(
      selectedAccount.address as SS58Address,
    );

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, selectedAccount?.address]);

  // TODO: Refactor submit logic

  const createManyUserAgentData = api.userAgentWeight.createMany.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      console.error("Error submitting data:", error);
    },
  });

  const deleteUserAgentData = api.userAgentWeight.delete.useMutation({
    onSuccess: () => {
      console.log("User agent data deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting user agent data:", error);
    },
  });

  const { refetch: refetchUserAgentWeight } =
    api.userAgentWeight.byUserKey.useQuery(
      { userKey: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address },
    );

  const handleSubmit = async () => {
    if (!selectedAccount?.address) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Please connect your wallet.",
      });
      return;
    }

    if (totalPercentage !== 100) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Ensure total percentage is 100%",
      });
      return;
    }

    if (Number(userStakeWeight) < 50) {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          "You must have at least 50 TORUS staked to allocate to agents",
      });
      return;
    }

    // Filter out agents with 0 percentage
    const filteredAgents = delegatedAgents.filter(
      (agent) => agent.percentage !== 0,
    );

    // Recalculate total percentage after filtering
    const filteredTotalPercentage = filteredAgents.reduce(
      (sum, agent) => sum + agent.percentage,
      0,
    );

    if (filteredTotalPercentage !== 100) {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          "Total percentage must be 100% after removing agents with 0%",
      });
      return;
    }

    try {
      // Delete existing user agent data
      await deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      });

      // Prepare data for createManyUserAgentData
      const agentsData = filteredAgents.map((agent) => ({
        agentKey: agent.address,
        weight: agent.percentage,
      }));

      // Submit new user agent data in a single call
      await createManyUserAgentData.mutateAsync(agentsData);

      updateOriginalAgents();

      const { data: refetchedData } = await refetchUserAgentWeight();

      const formattedModules = refetchedData?.map((agent) => ({
        id: agent.user_agent_weight.id,
        address: agent.user_agent_weight.agentKey,
        title: agent.agent.name ?? "",
        name: agent.agent.name ?? "",
        percentage: agent.user_agent_weight.weight,
        registrationBlock: agent.agent.registrationBlock,
        metadataUri: agent.agent.metadataUri,
      }));

      setDelegatedAgentsFromDB(formattedModules ?? []);

      setPercentageChange(false);

      toast({
        title: "Success!",
        description: "Allocation submitted.",
      });
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleRemoveAllWeight = async () => {
    if (!selectedAccount?.address) {
      return;
    }

    try {
      await deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      });
      setDelegatedAgentsFromDB([]);

      // await refetchUserAgentWeight();
    } catch (error) {
      console.error("Error removing weight:", error);
    }
  };

  return (
    <SheetFooter className="flex min-h-fit gap-4 sm:flex-col sm:space-x-0">
      {/* <StatusLabel status={submitStatus} /> */} Submit Status
      <div className="mt-auto flex w-full flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button
            onClick={handleAutoCompletePercentage}
            className="w-1/2"
            disabled={totalPercentage === 100 || delegatedAgents.length === 0}
            variant="outline"
          >
            Complete 100%
          </Button>

          <Button
            onClick={handleRemoveAllWeight}
            className="w-1/2"
            disabled={!hasItemsToClear}
            variant="outline"
          >
            {isSubmitting ? "Removing..." : `Remove Agents`}
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          variant="outline"
          className="w-full"
          // disabled={submitStatus.disabled}
          title="Submit Agents"
        >
          {isSubmitting ? "Submitting..." : "Submit Agents"}
        </Button>
      </div>
    </SheetFooter>
  );
}
