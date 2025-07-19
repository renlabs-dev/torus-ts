"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { useToast } from "@torus-ts/ui/hooks/use-toast";

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

  async function handleCopyClick(value: string): Promise<void> {
    const [error, _] = await tryAsync(navigator.clipboard.writeText(value));

    if (error !== undefined) {
      toast.error("Failed to copy treasury address.");
      return;
    }

    toast.success("Treasury address copied to clipboard.");
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
