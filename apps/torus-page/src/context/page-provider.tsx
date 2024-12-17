"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import type {
  Balance,
  LastBlock,
  SS58Address,
  StakeData,
} from "@torus-ts/subspace";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import type { Bridge, Stake } from "@torus-ts/torus-provider/types";
import {
  useBridgedBalance,
  useBridgedBalances,
  useCachedStakeOut,
  useFreeBalance,
  useKeyStakedBy,
  useLastBlock,
} from "@torus-ts/providers/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { WalletDropdown } from "@torus-ts/ui";

interface PageContextType {
  isInitialized: boolean;
  lastBlock: UseQueryResult<LastBlock, Error>;

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

  bridge: (bridge: Bridge) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;

  stakeOut: UseQueryResult<StakeData, Error>;

  accountBridgedBalance: UseQueryResult<bigint, Error>;
  bridgedBalances: UseQueryResult<[Map<SS58Address, bigint>, Error[]], Error>;

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
    api,
    isInitialized,
    selectedAccount,
    isAccountConnected,

    bridge,
    removeStake,

    accounts,
    handleLogout,
    handleGetWallets,
    handleSelectWallet,
  } = useTorus();
  const lastBlock = useLastBlock(api);

  // == Account ==
  const accountFreeBalance = useFreeBalance(
    lastBlock.data?.apiAtBlock,
    selectedAccount?.address as SS58Address,
  );

  const accountStakedBy = useKeyStakedBy(api, selectedAccount?.address);

  // == Subspace ==

  const stakeOut = useCachedStakeOut(
    // eslint-disable-next-line no-restricted-properties
    String(process.env.NEXT_PUBLIC_CACHE_PROVIDER_URL),
  );

  const accountStakedBalance =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    stakeOut.data?.perAddr[selectedAccount?.address!];

  // == Bridge ==
  const accountBridgedBalance = useBridgedBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const bridgedBalances = useBridgedBalances(api);

  return (
    <PageContext.Provider
      value={{
        isInitialized,
        lastBlock,

        stakeOut,

        selectedAccount,

        accountStakedBy,
        isAccountConnected,
        accountFreeBalance,
        accountStakedBalance,

        accountBridgedBalance,
        bridgedBalances,

        bridge,
        removeStake,

        accounts,
        handleLogout,
        handleGetWallets,
        handleSelectWallet,
      }}
    >
      <WalletDropdown
        balance={accountFreeBalance.data}
        stakeOut={stakeOut.data}
        accounts={accounts}
        selectedAccount={selectedAccount}
        handleLogout={handleLogout}
        handleGetWallets={handleGetWallets}
        handleSelectWallet={handleSelectWallet}
      />
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
