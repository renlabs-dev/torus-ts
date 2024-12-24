"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUp, PieChart, X } from "lucide-react";

import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  buttonVariants,
  Card,
  cn,
  Input,
  Label,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";

export function DelegatedList() {
  const {
    delegatedAgents,
    updatePercentage: updatePercentage,
    removeAgent,
    getTotalPercentage,
    setDelegatedAgentsFromDB,
    updateOriginalAgents,
    hasUnsavedChanges,
  } = useDelegateAgentStore();

  const totalPercentage = getTotalPercentage();

  const { selectedAccount, api: torusApi } = useTorus();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountStakedBy = useKeyStakedBy(torusApi, selectedAccount?.address);

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
      updatePercentage(item.id, newPercentage);
    });
  }

  const {
    data: userAgentWeight,
    error: agentError,
    refetch: refetchModules,
  } = api.userAgentWeight.byUserKey.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  // ORIGINAL VALUE
  const validatorAddress = "5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2";
  //DEV VALIDATOR
  // const validatorAddress = "5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt";

  function userWeightPower(
    userStakes: { address: string; stake: bigint }[] | undefined,
    validatorAddress: string,
  ) {
    if (!userStakes) {
      return BigInt(0);
    }
    const data = userStakes
      .filter((stake) => validatorAddress.includes(stake.address))
      .reduce((sum, stake) => sum + stake.stake, 0n);

    return formatToken(Number(data));
  }

  const userStakeWeight = userWeightPower(
    accountStakedBy.data,
    validatorAddress,
  );

  useEffect(() => {
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
      }));
      setDelegatedAgentsFromDB(formattedModules);
    }
  }, [userAgentWeight, agentError, setDelegatedAgentsFromDB]);

  const handlePercentageChange = (id: number, percentage: number) => {
    if (percentage >= 0 && percentage <= 100) {
      updatePercentage(id, percentage);
    }
  };

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

  const handleSubmit = async () => {
    console.log(totalPercentage !== 100);
    if (!selectedAccount?.address || totalPercentage !== 100) {
      toast.error(
        "Please connect your wallet and ensure total percentage is 100%",
      );
      return;
    }
    // TODO: UNCOMMENT THIS CODE
    // if (Number(userStakeWeight) <= 50) {
    //   toast.error(
    //     "You must have at least 50 COMAI staked to delegate agents or subnets",
    //   );
    //   return;
    // }
    setIsSubmitting(true);
    try {
      // Delete existing user agent data
      await deleteUserAgentData.mutateAsync({
        userKey: selectedAccount.address,
      });

      // Prepare data for createManyUserAgentData
      const agentsData = delegatedAgents.map((agent) => ({
        agentKey: agent.address,
        weight: agent.percentage,
      }));

      // Submit new user agent data in a single call
      await createManyUserAgentData.mutateAsync(agentsData);

      updateOriginalAgents();

      // Fetch updated data from the database
      const { data: updatedAgentData } = api.userAgentWeight.byUserKey.useQuery(
        { userKey: selectedAccount.address },
        { enabled: !!selectedAccount.address },
      );
      await refetchModules();
      const formattedModules = updatedAgentData?.map((agent) => ({
        id: agent.user_agent_weight.id,
        address: agent.user_agent_weight.agentKey,
        title: agent.agent.name ?? "",
        name: agent.agent.name ?? "",
        percentage: agent.user_agent_weight.weight,
      }));
      setDelegatedAgentsFromDB(formattedModules ?? []);

      setIsSubmitting(false);
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

      await refetchModules();

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error removing weight:", error);
      setIsSubmitting(false);
    }
  };

  const hasItemsToClear = delegatedAgents.length > 0;

  const hasZeroPercentage = () => {
    const items = delegatedAgents;
    return items.some((item) => item.percentage === 0);
  };

  function getSubmitStatus() {
    if (!selectedAccount?.address) {
      return { disabled: true, message: "Please connect your wallet" };
    }
    if (totalPercentage !== 100) {
      return { disabled: true, message: "Total percentage must be 100%" };
    }
    if (hasZeroPercentage()) {
      return {
        disabled: true,
        message: "Remove or allocate weight to all items",
      };
    }
    if (isSubmitting) {
      return { disabled: true, message: "Submitting..." };
    }
    if (hasUnsavedChanges()) {
      return { disabled: false, message: "You have unsaved changes" };
    }
    return { disabled: false, message: "All changes saved!" };
  }
  const submitStatus = getSubmitStatus();

  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight = window.innerHeight - 270;
      setIsOverflowing(contentHeight > maxAllowedHeight);
      console.log("Is overflowing:", contentHeight > maxAllowedHeight);
    }
  }, [delegatedAgents, isOpen]);

  return (
    <Sheet
      onOpenChange={(state) => {
        setIsOpen(state);
      }}
    >
      <SheetTrigger
        className={`fixed bottom-4 right-4 z-[60] ${buttonVariants({ variant: "outline" })}`}
      >
        <PieChart />
        Allocation Menu
      </SheetTrigger>

      <SheetContent on className="z-[70] flex w-full flex-col sm:max-w-md">
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
                  [
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                    ...delegatedAgents,
                  ].map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex flex-col gap-1.5 border-b border-muted-foreground/20 py-4 first:border-t last:border-b-0 ${isOverflowing ? "mr-2.5" : "last:!border-b-[1px]"}`}
                    >
                      <span className="font-medium">{agent.name}</span>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          {smallAddress(agent.address, 4)}
                        </span>

                        <div className="flex items-center gap-1">
                          <Label
                            className="relative flex h-[36px] items-center gap-1 rounded-md border px-2"
                            htmlFor={`percentage:${agent.id}`}
                          >
                            <Input
                              id={`percentage:${agent.id}`}
                              type="number"
                              value={agent.percentage}
                              onChange={(e) =>
                                handlePercentageChange(
                                  agent.id,
                                  Number(e.target.value),
                                )
                              }
                              min="0"
                              max="100"
                              className="w-fit border-none px-0 py-0 [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />

                            <span className="text-muted-foreground">%</span>
                          </Label>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => removeAgent(agent.id)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Select a agent to allocate through the agents page.
                    </TableCell>
                  </TableRow>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="flex min-h-fit gap-4 sm:flex-col">
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
                  Auto-Complete to 100%
                </Button>

                <Button
                  onClick={handleRemoveAllWeight}
                  className="w-1/2"
                  disabled={isSubmitting || !hasItemsToClear}
                  variant="outline"
                >
                  {isSubmitting ? "Removing..." : `Remove Agents`}
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

{
  /* <Table className="">
<TableHeader>
  <TableRow>
    <TableHead>Module</TableHead>
    <TableHead>Address</TableHead>
    <TableHead>Percentage</TableHead>
    <TableHead>Clear</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {delegatedAgents.length ? (
    [
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
      ...delegatedAgents,
    ].map((agent) => (
      <TableRow key={agent.id}>
        <TableCell className="font-medium">
          {agent.name}
        </TableCell>
        <TableCell className="text-gray-400">
          {smallAddress(agent.address, 4)}
        </TableCell>
        <TableCell className="flex items-center gap-1">
          <Input
            type="number"
            value={agent.percentage}
            onChange={(e) =>
              handlePercentageChange(
                agent.id,
                Number(e.target.value),
              )
            }
            min="0"
            max="100"
            className="w-16"
          />
          <Label className="relative right-5 text-gray-400">
            %
          </Label>
        </TableCell>
        <TableCell>
          <Button
            size="icon"
            variant="outline"
            onClick={() => removeAgent(agent.id)}
          >
            <X className="h-5 w-5" />
          </Button>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={4} className="text-center">
        Select a agent to allocate through the agents page.
      </TableCell>
    </TableRow>
  )}
</TableBody>
</Table> */
}
