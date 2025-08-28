"use client";

import { createContext, useContext } from "react";

import type { UseQueryResult } from "@tanstack/react-query";

import type { StakeData } from "@torus-network/sdk/cached-queries";
import type { LastBlock } from "@torus-network/sdk/chain";
import type { Balance, SS58Address } from "@torus-network/sdk/types";
import { fromNano } from "@torus-network/torus-utils/torus/token";

import {
  useCachedStakeOut,
  useFreeBalance,
  useKeyStakingTo,
  useLastBlock,
  useMinAllowedStake,
  useRewardInterval,
  useTransactionFee,
} from "@torus-ts/query-provider/hooks";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";
import { MIN_EXISTENTIAL_BALANCE } from "~/utils/constants";

interface WalletContextType {
  isInitialized: boolean;
  accounts: InjectedAccountWithMeta[] | undefined;
  isAccountConnected: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountStakedBalance: bigint | undefined;
  accountStakedBy: UseQueryResult<
    { address: SS58Address; stake: Balance }[],
    Error
  >;
  stakeOut: UseQueryResult<StakeData, Error>;
  minAllowedStake: UseQueryResult<bigint, Error>;
  lastBlock: UseQueryResult<LastBlock, Error>;
  rewardInterval: UseQueryResult<bigint, Error>;
  // Simplified fee estimation
  estimatedFee: bigint | undefined;
  isFeeLoading: boolean;
  feeError: Error | null;
  // Maximum transferable amount (as string for forms)
  maxTransferableAmount: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const torus = useTorus();

  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));
  const accountFreeBalance = useFreeBalance(
    torus.api,
    torus.selectedAccount?.address as SS58Address,
  );
  const minAllowedStake = useMinAllowedStake(torus.api);
  const accountStakedBy = useKeyStakingTo(
    torus.api,
    torus.selectedAccount?.address,
  );
  const lastBlock = useLastBlock(torus.api);
  const rewardInterval = useRewardInterval(torus.api);

  const accountStakedBalance = torus.selectedAccount?.address
    ? stakeOut.data?.perAddr[torus.selectedAccount.address]
    : undefined;

  const placeholderAddr =
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" as SS58Address;

  const placeholderTx =
    torus.api?.tx.balances.transferAllowDeath(placeholderAddr, 100) ?? null;

  const {
    data: estimatedFee,
    isLoading: isFeeLoading,
    error: feeError,
  } = useTransactionFee(placeholderTx, placeholderAddr);

  // Calculate maximum transferable amount
  const freeBalance = accountFreeBalance.data ?? 0n;

  const maxTransferableAmount = (() => {
    if (!torus.selectedAccount?.address || freeBalance <= 0n || !estimatedFee) {
      return "";
    }

    // Apply 225% buffer to estimated fee (matching old implementation)
    const feeBuffer = 225n;
    const adjustedFee = (estimatedFee * feeBuffer) / 100n;

    // Calculate max transferable amount considering fee and existential deposit
    const totalReserved = adjustedFee + MIN_EXISTENTIAL_BALANCE;
    const maxTransferable =
      freeBalance > totalReserved ? freeBalance - totalReserved : 0n;

    return fromNano(maxTransferable);
  })();

  return (
    <WalletContext.Provider
      value={{
        ...torus,
        accountFreeBalance,
        accountStakedBalance,
        accountStakedBy,
        minAllowedStake,
        stakeOut,
        lastBlock,
        rewardInterval,
        estimatedFee,
        isFeeLoading,
        feeError,
        maxTransferableAmount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
