"use client";

import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  Balance,
  LastBlock,
  SS58Address,
  StakeData,
} from "@torus-network/sdk";
import {
  useCachedStakeOut,
  useFreeBalance,
  useKeyStakingTo,
  useLastBlock,
  useMinAllowedStake,
  useRewardInterval,
} from "@torus-ts/query-provider/hooks";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { useTorus } from "@torus-ts/torus-provider";
import type {
  Stake,
  Transfer,
  TransferStake,
} from "@torus-ts/torus-provider/types";
import { createContext, useContext } from "react";
import { env } from "~/env";
export type { ISubmittableResult, SubmittableExtrinsic };

export type TransactionExtrinsicPromise =
  | SubmittableExtrinsic<"promise", ISubmittableResult>
  | undefined;

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
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  addStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  stakeOut: UseQueryResult<StakeData, Error>;
  getExistentialDeposit: () => bigint | undefined;
  minAllowedStake: UseQueryResult<bigint, Error>;
  transferTransaction: ({
    to,
    amount,
  }: Omit<
    Transfer,
    "callback" | "refetchHandler"
  >) => TransactionExtrinsicPromise;
  addStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;
  removeStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;
  transferStakeTransaction: ({
    fromValidator,
    toValidator,
    amount,
  }: Omit<
    TransferStake,
    "callback" | "refetchHandler"
  >) => TransactionExtrinsicPromise;
  lastBlock: UseQueryResult<LastBlock, Error>;
  rewardInterval: UseQueryResult<bigint, Error>;
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
