"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Button,
  Card,
  cn,
  Input,
  Label,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils";

import { useDelegateModuleStore } from "~/stores/delegateModuleStore";
import { useDelegateSubnetStore } from "~/stores/delegateSubnetStore";
import { api } from "~/trpc/react";
import { ChevronsUp, X } from "lucide-react";

export function DelegatedList() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("modules"); // Default value

  useEffect(() => {
    const currentRoute =
      pathname === "/subnets" || pathname === "/weighted-subnets"
        ? "subnets"
        : "modules";
    setActiveTab(currentRoute);
  }, [pathname]);

  const {
    delegatedModules,
    updatePercentage: updateModulePercentage,
    removeModule,
    getTotalPercentage: getModuleTotalPercentage,
    setDelegatedModulesFromDB,
    updateOriginalModules,
    hasUnsavedChanges: hasUnsavedModuleChanges,
  } = useDelegateModuleStore();

  const {
    delegatedSubnets,
    updatePercentage: updateSubnetPercentage,
    removeSubnet,
    getTotalPercentage: getSubnetTotalPercentage,
    setDelegatedSubnetsFromDB,
    updateOriginalSubnets,
    hasUnsavedChanges: hasUnsavedSubnetChanges,
  } = useDelegateSubnetStore();

  const totalPercentage =
    activeTab === "modules"
      ? getModuleTotalPercentage()
      : getSubnetTotalPercentage();
  const { selectedAccount, userTotalStaked } = useTorus();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  function handleAutoCompletePercentage() {
    const items = activeTab === "modules" ? delegatedModules : delegatedSubnets;
    const updateFn =
      activeTab === "modules" ? updateModulePercentage : updateSubnetPercentage;

    const remainingPercentage = 100 - totalPercentage;
    const itemsToUpdate = items.length;

    if (itemsToUpdate === 0) return;

    const percentagePerItem = Math.floor(remainingPercentage / itemsToUpdate);
    const extraPercentage = remainingPercentage % itemsToUpdate;

    items.forEach((item, index) => {
      const newPercentage =
        item.percentage + percentagePerItem + (index < extraPercentage ? 1 : 0);
      updateFn(item.id, newPercentage);
    });
  }

  const {
    data: userModuleData,
    error: moduleError,
    refetch: refetchModules,
  } = api.module.byUserModuleData.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  const {
    data: userSubnetData,
    error: subnetError,
    refetch: refetchSubnets,
  } = api.subnet.byUserSubnetData.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  const validatorAddress = "5Hgik8Kf7nq5VBtW41psbpXu1kinXpqRs4AHotPe6u1w6QX2";

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

  const userStakeWeight = userWeightPower(userTotalStaked, validatorAddress);

  useEffect(() => {
    if (moduleError) {
      console.error("Error fetching user module data:", moduleError);
    }
    if (userModuleData) {
      const formattedModules = userModuleData.map((module) => ({
        id: module.module_data.id,
        address: module.module_data.moduleKey,
        title: module.module_data.name ?? "",
        name: module.module_data.name ?? "",
        percentage: module.user_module_data.weight,
      }));
      setDelegatedModulesFromDB(formattedModules);
    }
  }, [userModuleData, moduleError, setDelegatedModulesFromDB]);

  useEffect(() => {
    if (subnetError) {
      console.error("Error fetching user subnet data:", subnetError);
    }
    if (userSubnetData) {
      const formattedSubnets = userSubnetData.map((subnet) => ({
        id: subnet.subnet_data.netuid,
        name: subnet.subnet_data.name,
        percentage: subnet.user_subnet_data.weight,
        founderAddress: subnet.subnet_data.founder,
      }));
      setDelegatedSubnetsFromDB(formattedSubnets);
    }
  }, [userSubnetData, subnetError, setDelegatedSubnetsFromDB]);

  const handlePercentageChange = (id: number, percentage: number) => {
    if (percentage >= 0 && percentage <= 100) {
      if (activeTab === "modules") {
        updateModulePercentage(id, percentage);
      } else {
        updateSubnetPercentage(id, percentage);
      }
    }
  };

  const createManyUserModuleData =
    api.module.createManyUserModuleData.useMutation({
      onSuccess: () => {
        router.refresh();
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error("Error submitting data:", error);
        setIsSubmitting(false);
      },
    });

  const deleteUserModuleData = api.module.deleteUserModuleData.useMutation({
    onSuccess: () => {
      console.log("User module data deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting user module data:", error);
    },
  });

  const createManyUserSubnetData =
    api.subnet.createManyUserSubnetData.useMutation({
      onSuccess: () => {
        router.refresh();
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error("Error submitting data:", error);
        setIsSubmitting(false);
      },
    });

  const deleteUserSubnetData = api.subnet.deleteUserSubnetData.useMutation({
    onSuccess: () => {
      console.log("User subnet data deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting user subnet data:", error);
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
    if (Number(userStakeWeight) <= 50) {
      toast.error(
        "You must have at least 50 COMAI staked to delegate modules or subnets",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      if (activeTab === "modules") {
        // Delete existing user module data
        await deleteUserModuleData.mutateAsync({
          userKey: selectedAccount.address,
        });

        // Prepare data for createManyUserModuleData
        const modulesData = delegatedModules.map((module) => ({
          moduleId: module.id,
          weight: module.percentage,
          userKey: selectedAccount.address,
        }));

        // Submit new user module data in a single call
        await createManyUserModuleData.mutateAsync(modulesData);

        updateOriginalModules();
      } else {
        // Delete existing user subnet data
        void deleteUserSubnetData.mutateAsync({
          userKey: selectedAccount.address,
        });
        // Prepare data for createUserSubnetData
        const subnetsData = delegatedSubnets.map((subnet) => ({
          netuid: subnet.id,
          weight: subnet.percentage,
          userKey: selectedAccount.address,
        }));

        // Submit new user subnet data in a single call
        await createManyUserSubnetData.mutateAsync(subnetsData);

        updateOriginalSubnets();
      }
      // Fetch updated data from the database
      if (activeTab === "modules") {
        const { data: updatedModuleData } =
          api.module.byUserModuleData.useQuery(
            { userKey: selectedAccount.address },
            { enabled: !!selectedAccount.address },
          );
        await refetchModules();
        const formattedModules = updatedModuleData?.map((module) => ({
          id: module.module_data.id,
          address: module.module_data.moduleKey,
          title: module.module_data.name ?? "",
          name: module.module_data.name ?? "",
          percentage: module.user_module_data.weight,
        }));
        setDelegatedModulesFromDB(formattedModules ?? []);
      } else {
        const { data: updatedSubnetData } =
          api.subnet.byUserSubnetData.useQuery(
            { userKey: selectedAccount.address },
            { enabled: !!selectedAccount.address },
          );
        await refetchSubnets();
        if (updatedSubnetData) {
          const formattedSubnets = updatedSubnetData.map((subnet) => ({
            id: subnet.subnet_data.netuid,
            name: subnet.subnet_data.name,
            percentage: subnet.user_subnet_data.weight,
            founderAddress: subnet.subnet_data.founder,
          }));
          setDelegatedSubnetsFromDB(formattedSubnets);
        }
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting data:", error);
      setIsSubmitting(false);
    }
  };

  function handleModuleClick() {
    setActiveTab("modules");
    router.push("/modules");
  }
  function handleSubnetClick() {
    setActiveTab("subnets");
    router.push("/subnets");
  }

  const handleRemoveAllWeight = async () => {
    if (!selectedAccount?.address) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (activeTab === "modules") {
        await deleteUserModuleData.mutateAsync({
          userKey: selectedAccount.address,
        });
        setDelegatedModulesFromDB([]);
      } else {
        await deleteUserSubnetData.mutateAsync({
          userKey: selectedAccount.address,
        });
        setDelegatedSubnetsFromDB([]);
      }
      if (activeTab === "modules") {
        await refetchModules();
      } else {
        await refetchSubnets();
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error removing weight:", error);
      setIsSubmitting(false);
    }
  };

  const hasItemsToClear =
    activeTab === "modules"
      ? delegatedModules.length > 0
      : delegatedSubnets.length > 0;

  const hasZeroPercentage = () => {
    const items = activeTab === "modules" ? delegatedModules : delegatedSubnets;
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
    if (
      (activeTab === "modules" && hasUnsavedModuleChanges()) ||
      (activeTab === "subnets" && hasUnsavedSubnetChanges())
    ) {
      return { disabled: false, message: "You have unsaved changes" };
    }
    return { disabled: false, message: "All changes saved!" };
  }
  const submitStatus = getSubmitStatus();

  return (
    <div className={`${pathname === "/" ? "hidden" : "block"}`}>
      {selectedAccount?.address && (
        <div className="fixed bottom-0 right-0 z-50 mt-8 hidden w-full flex-col-reverse text-sm md:bottom-4 md:mr-4 md:flex md:w-fit">
          <Card className="mb-2 flex animate-fade-up flex-col rounded-3xl border border-white/20 bg-[#898989]/5 font-semibold text-white backdrop-blur-lg">
            <div className="flex items-center justify-center px-7">
              {["modules", "subnets", "stake"].map((type, index) => (
                <div key={type} className="flex items-center">
                  <Label
                    className={cn(
                      "flex items-center gap-1 text-sm font-semibold",
                      {
                        "text-cyan-500": activeTab === "subnets",
                        "text-green-500": activeTab !== "subnets",
                        "text-amber-500":
                          index === 1 && totalPercentage !== 100,
                      },
                    )}
                  >
                    <b>
                      {index === 0
                        ? activeTab === "modules"
                          ? delegatedModules.length
                          : delegatedSubnets.length
                        : index === 1
                          ? `${totalPercentage}%`
                          : userStakeWeight}
                    </b>
                    <span className="text-white">
                      {index === 0
                        ? activeTab === "modules"
                          ? "Modules"
                          : "Subnets"
                        : index === 1
                          ? "Allocated"
                          : "COMAI"}
                    </span>
                  </Label>
                  {index < 2 && (
                    <Separator className="mx-4 h-8" orientation="vertical" />
                  )}
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex w-full gap-2 p-3">
              {["modules", "subnets"].map((tab) => (
                <Button
                  key={tab}
                  variant="ghost"
                  onClick={
                    tab === "modules" ? handleModuleClick : handleSubnetClick
                  }
                  className={cn(
                    "rounded-full border",
                    activeTab === tab ? "border-white" : "border-white/20",
                  )}
                >
                  {tab.toUpperCase()}
                </Button>
              ))}
              <Button
                variant="base"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "w-full gap-1 rounded-full",
                  activeTab === "subnets"
                    ? "border-cyan-500 bg-cyan-600/15 text-cyan-500 hover:border-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/50"
                    : "border-green-500 bg-green-600/15 text-green-500 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50",
                )}
              >
                {isOpen ? "COLLAPSE " : "EXPAND "}
                <ChevronsUp
                  className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-180" : ""
                    }`}
                />
              </Button>
            </div>
          </Card>
          {isOpen && (
            <Card className="mb-2 flex animate-fade-up flex-col rounded-3xl border border-white/20 bg-[#898989]/5 p-4 font-semibold text-white backdrop-blur-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {activeTab === "modules" ? "Module" : "Subnet"}
                    </TableHead>
                    <TableHead>
                      {activeTab === "modules" ? "Address" : "Founder"}
                    </TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Clear</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === "modules" ? (
                    delegatedModules.length ? (
                      delegatedModules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">
                            {module.name}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {smallAddress(module.address, 4)}
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={module.percentage}
                              onChange={(e) =>
                                handlePercentageChange(
                                  module.id,
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
                              variant="default-red"
                              onClick={() => removeModule(module.id)}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Select a module to allocate through the modules page.
                        </TableCell>
                      </TableRow>
                    )
                  ) : delegatedSubnets.length ? (
                    delegatedSubnets.map((subnet) => (
                      <TableRow key={subnet.id}>
                        <TableCell className="font-medium">
                          {subnet.name}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {smallAddress(subnet.founderAddress, 4)}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={subnet.percentage}
                            onChange={(e) =>
                              handlePercentageChange(
                                subnet.id,
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
                            variant="default-red"
                            onClick={() => removeSubnet(subnet.id)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-wrap text-center">
                        Select a subnet to allocate through the subnets page.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Separator />
              <div className="flex flex-row gap-3 pt-4">
                <Button
                  onClick={handleAutoCompletePercentage}
                  disabled={
                    totalPercentage === 100 || activeTab === "modules"
                      ? delegatedModules.length === 0
                      : delegatedSubnets.length === 0
                  }
                  variant="default-purple"
                  className="w-full rounded-full"
                >
                  Auto-Complete to 100%
                </Button>

                <Button
                  onClick={handleRemoveAllWeight}
                  disabled={isSubmitting || !hasItemsToClear}
                  variant="default-red"
                  className="w-full rounded-full"
                >
                  {isSubmitting
                    ? "Removing..."
                    : `Remove ${activeTab === "modules" ? "Modules" : "Subnets"}`}
                </Button>
              </div>
              <Separator className="my-4" />
              <Button
                onClick={handleSubmit}
                variant="base"
                className={cn(
                  "w-full rounded-full",
                  activeTab === "subnets"
                    ? "border-cyan-500 bg-cyan-600/15 text-cyan-500 hover:border-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/50"
                    : "border-green-500 bg-green-600/15 text-green-500 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50",
                )}
                disabled={submitStatus.disabled}
                title={submitStatus.disabled ? submitStatus.message : ""}
              >
                {isSubmitting
                  ? "Submitting..."
                  : activeTab === "modules"
                    ? "Submit Modules"
                    : "Submit Subnets"}
              </Button>
              <Label
                className={cn("pt-2 text-center text-sm", {
                  "text-pink-500":
                    submitStatus.message === "You have unsaved changes",
                  "text-cyan-500":
                    submitStatus.message === "All changes saved!" &&
                    activeTab === "subnets",
                  "text-green-500":
                    submitStatus.message === "All changes saved!" &&
                    activeTab !== "subnets",
                  "text-amber-500": ![
                    "You have unsaved changes",
                    "All changes saved!",
                  ].includes(submitStatus.message),
                })}
              >
                {submitStatus.message}
              </Label>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
