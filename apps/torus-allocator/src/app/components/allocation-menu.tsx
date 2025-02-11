"use client";

import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { toast } from "@torus-ts/toast-provider";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { Anvil, LoaderCircle, PieChart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";

import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from "@torus-ts/ui";

import { ALLOCATOR_ADDRESS } from "~/consts";

export function AllocationMenu() {
  const {
    delegatedAgents,
    getTotalPercentage,
    hasUnsavedChanges,
    removeAgent,
    setDelegatedAgentsFromDB,
    updateOriginalAgents,
    updatePercentage,
    getAgentPercentage,
    hasPercentageChange,
    setPercentageChange,
  } = useDelegateAgentStore();

  const { selectedAccount, api: torusApi } = useTorus();
  const accountStakedBy = useKeyStakedBy(torusApi, ALLOCATOR_ADDRESS);

  const {
    data: userAgentWeight,
    error: agentError,
    refetch: refetchUserAgentWeight,
  } = api.userAgentWeight.byUserKey.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const totalPercentage = getTotalPercentage();

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createManyUserAgentData = api.userAgentWeight.createMany.useMutation({
    onSuccess: () => {
      router.refresh();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error submitting data:", error);
      setIsSubmitting(false);
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

  const userStakeWeight = useMemo(() => {
    if (!accountStakedBy.data || !selectedAccount?.address) {
      return BigInt(0);
    }

    const stake = accountStakedBy.data.get(
      selectedAccount.address as SS58Address,
    );

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, selectedAccount?.address]);

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

  const [tempInputs, setTempInputs] = useState<
    Record<string, string | undefined>
  >({});

  const handlePercentageChange = (
    agentKey: string | SS58Address,
    value: string,
  ) => {
    const sanitizedValue = value.replace(/[^\d.]/g, "");
    setTempInputs((prev) => ({ ...prev, [agentKey]: sanitizedValue }));
  };

  const handleInputBlur = (agentKey: string | SS58Address) => {
    const value = tempInputs[agentKey];
    if (value !== undefined) {
      const percentage = Math.min(Math.max(Number(value), 0), 100);
      updatePercentage(agentKey, percentage);
      setTempInputs((prev) => ({ ...prev, [agentKey]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedAccount?.address || totalPercentage !== 100) {
      toast.error(
        "Please connect your wallet and ensure total percentage is 100%",
      );
      return;
    }

    if (Number(userStakeWeight) < 50) {
      toast.error(
        "You must have at least 50 TORUS staked to allocate to agents",
      );
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
      toast.error(
        "Total percentage must be 100% after removing agents with 0%",
      );
      return;
    }

    setIsSubmitting(true);

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

      setIsSubmitting(false);
      setPercentageChange(false);

      toast.success("Allocation submitted successfully");
    } catch (error) {
      console.error("Error submitting data:", error);
      setIsSubmitting(false);
    }
  };

  const handleRemoveAllWeight = async () => {
    if (!selectedAccount?.address) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      });
      setDelegatedAgentsFromDB([]);

      await refetchUserAgentWeight();

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error removing weight:", error);
      setIsSubmitting(false);
    }
  };

  const hasItemsToClear = delegatedAgents.length > 0;

  function getSubmitStatus() {
    if (!selectedAccount?.address) {
      return { disabled: true, message: "Please connect your wallet" };
    }
    if (totalPercentage !== 100) {
      return { disabled: true, message: "Total percentage must be 100%" };
    }
    if (isSubmitting) {
      return { disabled: true, message: "Submitting..." };
    }
    if (hasUnsavedChanges()) {
      return { disabled: false, message: "You have unsaved changes" };
    }
    if (hasPercentageChange) {
      return { disabled: false, message: "You have unsaved changes" };
    }
    return { disabled: false, message: "All changes saved!" };
  }
  const submitStatus = getSubmitStatus();

  useEffect(() => {
    if (!selectedAccount?.address) return setDelegatedAgentsFromDB([]);

    if (agentError) {
      console.error("Error fetching user agent data:", agentError);
    }

    if (userAgentWeight) {
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
    }
  }, [userAgentWeight, agentError, setDelegatedAgentsFromDB, selectedAccount]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const maxAllowedHeight = window.innerHeight - 270;
        setIsOverflowing(contentHeight > maxAllowedHeight);
      }
    }, 1); // Small delay to ensure content have been rendered before checking height

    return () => clearTimeout(timeoutId);
  }, [delegatedAgents]);

  return (
    <Sheet>
      <div className="fixed bottom-4 right-3 z-[50] flex w-fit flex-col items-center justify-end marker:flex md:bottom-14">
        <Label
          className={cn("mb-2 animate-pulse text-end text-sm", {
            "text-red-500": submitStatus.message === "You have unsaved changes",
            "text-cyan-500": submitStatus.message === "All changes saved!",
            "text-green-500": submitStatus.message === "All changes saved!",
            "text-amber-500": ![
              "You have unsaved changes",
              "All changes saved!",
            ].includes(submitStatus.message),
          })}
        >
          {submitStatus.message !== "All changes saved!" &&
            submitStatus.message}
        </Label>
        <div className="flex items-center gap-2">
          <SheetTrigger asChild disabled={!selectedAccount}>
            <Button
              variant="outline"
              className="w-full border border-primary/80"
            >
              {!selectedAccount ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <PieChart />
              )}
              Allocation Menu
            </Button>
          </SheetTrigger>
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={submitStatus.disabled}
            className={`w-full border ${submitStatus.message === "All changes saved!" ? "border-green-500 bg-[#14252A] text-green-500 hover:bg-green-500/20 hover:text-green-500" : "border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-500"}`}
            title={submitStatus.disabled ? submitStatus.message : ""}
          >
            <Anvil />
            {isSubmitting ? "Submitting Allocation" : "Submit Allocation"}
          </Button>
        </div>
      </div>

      <SheetContent className={"fixed z-[70] flex w-full flex-col sm:max-w-md"}>
        <div className="flex h-full flex-col justify-between gap-8">
          <div className="flex h-full flex-col gap-8">
            <SheetHeader>
              <SheetTitle>Allocation Menu</SheetTitle>
            </SheetHeader>

            <div
              ref={contentRef}
              className="max-h-[calc(100vh-270px)] overflow-y-auto"
            >
              <div className="flex flex-col gap-2">
                {delegatedAgents.length ? (
                  delegatedAgents
                    .slice() // Create a shallow copy to avoid mutating the original array
                    .sort((a, b) => a.address.localeCompare(b.address)) // Sort by address
                    .map((agent) => (
                      <div
                        key={agent.address} // Use address as the key for more stability
                        className={`flex flex-col gap-1.5 border-b border-muted-foreground/20 py-4 first:border-t last:border-b-0 ${
                          isOverflowing ? "mr-2.5" : "last:!border-b-[1px]"
                        }`}
                      >
                        <span className="font-medium">{agent.name}</span>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            {smallAddress(agent.address, 6)}
                          </span>

                          <div className="flex items-center gap-1">
                            <Label
                              className="rounded-radius relative flex h-[36px] items-center gap-1 border bg-[#080808] px-2"
                              htmlFor={`percentage:${agent.address}`} // Use address instead of id
                            >
                              <Input
                                type="text"
                                value={
                                  tempInputs[agent.address] ??
                                  getAgentPercentage(agent.address)
                                }
                                onChange={(e) =>
                                  handlePercentageChange(
                                    agent.address,
                                    e.target.value,
                                  )
                                }
                                onBlur={() => handleInputBlur(agent.address)}
                                maxLength={3}
                                className="w-7 border-x-0 border-y px-0 py-0 focus-visible:ring-0"
                              />

                              <span className="text-muted-foreground">%</span>
                            </Label>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => removeAgent(agent.address)}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p>Select a agent to allocate through the agents page.</p>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="flex min-h-fit gap-4 sm:flex-col sm:space-x-0">
            <Label
              className={cn("pt-2 text-center text-sm", {
                "text-pink-500":
                  submitStatus.message === "You have unsaved changes",
                "text-cyan-500": submitStatus.message === "All changes saved!",
                "text-green-500": submitStatus.message === "All changes saved!",
                "text-amber-500": ![
                  "You have unsaved changes",
                  "All changes saved!",
                ].includes(submitStatus.message),
              })}
            >
              {submitStatus.message}
            </Label>
            <div className="mt-auto flex w-full flex-col gap-2">
              <div className="flex flex-row gap-2">
                <Button
                  onClick={handleAutoCompletePercentage}
                  className="w-1/2"
                  disabled={
                    totalPercentage === 100 || delegatedAgents.length === 0
                  }
                  variant="outline"
                >
                  Complete 100%
                </Button>

                <Button
                  onClick={handleRemoveAllWeight}
                  className="w-1/2"
                  disabled={isSubmitting || !hasItemsToClear}
                  variant="outline"
                >
                  {isSubmitting ? "Removing..." : "Remove Agents"}
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                variant="outline"
                className="w-full"
                disabled={submitStatus.disabled}
                title={submitStatus.disabled ? submitStatus.message : ""}
              >
                {isSubmitting ? "Submitting..." : "Submit Agents"}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
