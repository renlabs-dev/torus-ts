"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import type { Balance, SS58Address, StakeData } from "@torus-ts/subspace";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import type {
  Stake,
  Transfer,
  TransferStake,
} from "@torus-ts/torus-provider/types";
import {
  useCachedStakeOut,
  useFreeBalance,
  useKeyStakingTo,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";

interface WalletContextType {
  isInitialized: boolean;

  accounts: InjectedAccountWithMeta[] | undefined;
  isAccountConnected: boolean;

  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountStakedBalance: bigint | undefined;
  accountStakedBy: UseQueryResult<
    {
      address: SS58Address;
      stake: Balance;
    }[],
    Error
  >;

  estimateFee: (
    recipientAddress: string,
    amount: string,
  ) => Promise<bigint | null>;

  addStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;

  stakeOut: UseQueryResult<StakeData, Error>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // == API Context ==
  const {
    api,
    isInitialized,
    selectedAccount,
    isAccountConnected,

    estimateFee,
    transfer,
    addStake,
    transferStake,
    removeStake,

    accounts,
  } = useTorus();

  // == Subspace ==
  const stakeOut = useCachedStakeOut(env.NEXT_PUBLIC_TORUS_CACHE_URL);

  // == Account ==
  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const accountStakedBy = useKeyStakingTo(api, selectedAccount?.address);

  const accountStakedBalance =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    stakeOut.data?.perAddr[selectedAccount?.address!];

  return (
    <WalletContext.Provider
      value={{
        isInitialized,

        stakeOut,

        accounts,
        selectedAccount,

        accountStakedBy,
        isAccountConnected,
        accountFreeBalance,
        accountStakedBalance,

        estimateFee,

        addStake,
        transfer,
        transferStake,
        removeStake,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === null) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
