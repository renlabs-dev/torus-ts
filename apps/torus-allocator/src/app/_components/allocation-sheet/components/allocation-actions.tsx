"use client";

import type { SS58Address } from "@torus-network/sdk";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { env } from "~/env";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import useSubmitStore from "~/stores/submitStore";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { StatusConfig } from "./get-submit-status";
import { StatusLabel } from "./status-label";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface MenuTriggerProps {
  submitStatus: StatusConfig;
}

export function AllocationActions(props: MenuTriggerProps) {
  const {
    delegatedAgents,
    updateBalancedPercentage,
    getTotalPercentage,
    setPercentageChange,

    setDelegatedAgentsFromDB,
  } = useDelegateAgentStore();

  const router = useRouter();
  const { toast } = useToast();
  const { selectedAccount, api: torusApi } = useTorus();

  const { isSubmitting, setSubmitting } = useSubmitStore();

  const totalPercentage = getTotalPercentage();

  const hasItemsToClear = delegatedAgents.length > 0;

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
      updateBalancedPercentage(item.address, newPercentage);
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
    if (totalPercentage > 100) {
      toast.error("Ensure total percentage is less than 100%");
      return;
    }

    if (Number(userStakeWeight) < 50) {
      toast.error(
        "You must have at least 50 TORUS staked to allocate to agents",
      );
      return;
    }

    if (!selectedAccount?.address) {
      return;
    }

    // Filter out agents with 0 percentage
    const filteredAgents = delegatedAgents.filter(
      (agent) => agent.percentage !== 0,
    );

    setSubmitting(true);

    // Delete existing user agent data
    const [deleteError] = await tryAsync(
      deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      }),
    );

    if (deleteError !== undefined) {
      console.error("Error deleting user agent data:", deleteError);
      toast.error("Failed to update agent allocations");
      setSubmitting(false);
      return;
    }

    // Prepare data for createManyUserAgentData
    const agentsData = filteredAgents.map((agent) => ({
      agentKey: agent.address,
      weight: agent.percentage,
    }));

    // Submit new user agent data in a single call
    const [createError] = await tryAsync(
      createManyUserAgentData.mutateAsync(agentsData),
    );

    if (createError !== undefined) {
      console.error("Error creating user agent data:", createError);
      toast.error("Failed to save agent allocations");
      setSubmitting(false);
      return;
    }

    const [refetchError, refetchedData] = await tryAsync(
      refetchUserAgentWeight(),
    );

    if (refetchError !== undefined) {
      console.error("Error refetching user agent weight:", refetchError);
      toast.error("Successfully saved but couldn't refresh data");
      setSubmitting(false);
      return;
    }

    const formattedModules = refetchedData.data?.map((agent) => ({
      id: agent.user_agent_weight.id,
      address: agent.user_agent_weight.agentKey,
      title: agent.agent.name ?? "",
      name: agent.agent.name ?? "",
      percentage: agent.user_agent_weight.weight,
      registrationBlock: agent.agent.registrationBlock,
      metadataUri: agent.agent.metadataUri,
      percComputedWeight: agent.computed_agent_weight?.percComputedWeight ?? 0,
      weightFactor: agent.agent.weightFactor,
    }));

    setDelegatedAgentsFromDB(formattedModules ?? []);
    setPercentageChange(false);
    setSubmitting(false);
    toast.success("Agent allocations updated successfully");
  };

  const handleRemoveAllWeight = async () => {
    if (!selectedAccount?.address) {
      return;
    }

    const [deleteError] = await tryAsync(
      deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      }),
    );

    if (deleteError !== undefined) {
      console.error("Error removing weight:", deleteError);
      toast.error("Failed to remove agent allocations");
      setSubmitting(false);
      return;
    }

    setDelegatedAgentsFromDB([]);

    const [refetchError] = await tryAsync(refetchUserAgentWeight());

    if (refetchError !== undefined) {
      console.error("Error refetching user agent weight:", refetchError);
      toast.error("Successfully removed but couldn't refresh data");
      return;
    }

    toast.success("All agent allocations removed successfully");
  };

  const delegatedAgentsPercentage = Math.round(
    delegatedAgents.reduce((sum, agent) => sum + agent.percentage, 0),
  );

  return (
    <div className="flex min-h-fit w-full flex-col items-center gap-4 sm:space-x-0">
      <div className="mt-auto flex w-full flex-col gap-2">
        <div className="border-border flex w-full items-center justify-between gap-2 border-t py-6">
          <Label>
            <span className="text-muted-foreground">Agents: </span>
            {delegatedAgents.length}
          </Label>
          <Label>
            <span className="text-muted-foreground">Allocation: </span>
            {delegatedAgentsPercentage}%
          </Label>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            onClick={handleAutoCompletePercentage}
            className="w-1/2 border-teal-500 bg-teal-500/20 font-bold text-teal-500
              hover:bg-teal-500/30 hover:text-teal-500"
            disabled={totalPercentage === 100 || delegatedAgents.length === 0}
            variant="outline"
          >
            Complete to 100%
          </Button>

          <Button
            onClick={handleRemoveAllWeight}
            className="w-1/2 border-rose-500 bg-rose-500/20 font-bold text-rose-500
              hover:bg-rose-500/30 hover:text-rose-500"
            disabled={!hasItemsToClear}
            variant="outline"
          >
            {isSubmitting ? "Removing..." : `Remove Agents`}
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          variant="outline"
          className="w-full border-green-500 bg-green-500/20 font-bold text-green-500
            hover:bg-green-500/30 hover:text-green-500"
          disabled={props.submitStatus.disabled || totalPercentage === 0}
          title="Submit Agents"
        >
          {isSubmitting ? "Submitting..." : "Submit Agents"}
        </Button>
      </div>
      <StatusLabel status={props.submitStatus} />
    </div>
  );
}
