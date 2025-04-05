"use client";

import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { SidebarInfoDesktop } from "./sidebar-info-desktop";
import { SidebarInfoMobile } from "./sidebar-info-mobile";

export interface SidebarDataProps {
  treasuryBalance: {
    value: string;
    isLoading: boolean;
  };
  treasuryAddress: {
    value: string;
    formattedValue: string;
    isLoading: boolean;
  };
  incentivesPayout: {
    value: string;
    isLoading: boolean;
  };
  cadreMembers: {
    value: number;
    isLoading: boolean;
  };
  voteThreshold: {
    value: number;
    isLoading: boolean;
  };
  handleCopyClick: (value: string) => void;
}

export const SidebarInfo = () => {
  const { rewardAllocation, daoTreasuryAddress, daoTreasuryBalance } =
    useGovernance();
  const { toast } = useToast();

  const { data: cadreListData, isLoading: isFetchingCadreList } =
    api.cadre.all.useQuery();

  function handleCopyClick(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Treasury address copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Failed to copy treasury address.",
        });
      });
  }

  // Safe access with type checking for treasury balance
  const treasuryBalanceIsLoading =
    daoTreasuryBalance.data === undefined || daoTreasuryBalance.error !== null;

  const formattedDaoTreasuryBalance =
    !treasuryBalanceIsLoading && daoTreasuryBalance.data
      ? formatToken(daoTreasuryBalance.data)
      : "";

  // Safe access with type checking for treasury address
  const treasuryAddressIsLoading =
    daoTreasuryAddress.data === undefined || daoTreasuryAddress.error !== null;

  const rawTreasuryAddress =
    !treasuryAddressIsLoading && daoTreasuryAddress.data
      ? daoTreasuryAddress.data
      : "";

  const formattedDaoTreasuryAddress = rawTreasuryAddress
    ? smallAddress(rawTreasuryAddress)
    : "";

  // Safe access with type checking for reward allocation
  const rewardAllocationIsLoading =
    rewardAllocation.data === undefined || rewardAllocation.error !== null;

  const formattedRewardAllocation =
    !rewardAllocationIsLoading && rewardAllocation.data
      ? formatToken(rewardAllocation.data)
      : "";

  const cadreCount =
    isFetchingCadreList || !cadreListData ? 0 : cadreListData.length;

  const voteThreshold =
    isFetchingCadreList || !cadreListData
      ? 0
      : Math.floor(cadreListData.length / 2 + 1);

  const sidebarData = {
    treasuryBalance: {
      value: formattedDaoTreasuryBalance,
      isLoading: treasuryBalanceIsLoading,
    },
    treasuryAddress: {
      value: rawTreasuryAddress,
      formattedValue: formattedDaoTreasuryAddress,
      isLoading: treasuryAddressIsLoading,
    },
    incentivesPayout: {
      value: formattedRewardAllocation,
      isLoading: rewardAllocationIsLoading,
    },
    cadreMembers: {
      value: cadreCount,
      isLoading: isFetchingCadreList,
    },
    voteThreshold: {
      value: voteThreshold,
      isLoading: isFetchingCadreList,
    },
    handleCopyClick,
  };

  return (
    <>
      <SidebarInfoDesktop data={sidebarData} />
      <SidebarInfoMobile data={sidebarData} />
    </>
  );
};
