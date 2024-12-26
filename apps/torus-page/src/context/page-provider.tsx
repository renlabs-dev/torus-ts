"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import type { Stake } from "@torus-ts/torus-provider/types";
import {
  useCachedStakeOut,
  useFreeBalance,
  useKeyStakingTo,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";
import type { Balance, SS58Address, StakeData } from "@torus-ts/subspace";

interface PageContextType {
  isInitialized: boolean;

  isAccountConnected: boolean;

  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountStakedBalance: bigint | undefined;
  accountStakingTo: UseQueryResult<
    {
      address: SS58Address;
      stake: Balance;
    }[],
    Error
  >;

  removeStake: (stake: Stake) => Promise<void>;

  stakeOut: UseQueryResult<StakeData, Error>;

  accounts: InjectedAccountWithMeta[] | undefined;
  handleLogout: () => void;
  handleGetWallets: () => Promise<void>;
  handleSelectWallet: (account: InjectedAccountWithMeta) => void;
}

const PageContext = createContext<PageContextType | null>(null);

export function PageProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // == API Context ==
  const {
    accounts,
    api,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    isAccountConnected,
    isInitialized,
    removeStake,
    selectedAccount,
  } = useTorus();

  // == Account ==
  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const accountStakingTo = useKeyStakingTo(api, selectedAccount?.address);

  // == Subspace ==

  const stakeOut = useCachedStakeOut(env.NEXT_PUBLIC_CACHE_PROVIDER_URL);

  const accountStakedBalance =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    stakeOut.data?.perAddr[selectedAccount?.address!];

  return (
    <PageContext.Provider
      value={{
        accountFreeBalance,
        accounts,
        accountStakedBalance,
        accountStakingTo,
        handleGetWallets,
        handleLogout,
        handleSelectWallet,
        isAccountConnected,
        isInitialized,
        removeStake,
        selectedAccount,
        stakeOut,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export const usePage = (): PageContextType => {
  const context = useContext(PageContext);
  if (context === null) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
};
