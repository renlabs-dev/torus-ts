"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { Header, WalletDropdown } from "@torus-ts/ui";
import type { SS58Address } from "@torus-ts/subspace";
import { env } from "~/env";

export function ForumHeader() {
  const {
    api,
    accounts,
    isInitialized,
    selectedAccount,
    handleLogout,
    handleGetWallets,
    handleSelectWallet,
  } = useTorus();

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const stakeOut = useCachedStakeOut(env.NEXT_PUBLIC_CACHE_PROVIDER_URL);

  return (
    <Header
      appName="Governance Portal"
      wallet={
        <WalletDropdown
          balance={accountFreeBalance.data}
          stakeOut={stakeOut.data}
          accounts={accounts}
          isInitialized={isInitialized}
          selectedAccount={selectedAccount}
          handleLogout={handleLogout}
          handleGetWallets={handleGetWallets}
          handleSelectWallet={handleSelectWallet}
        />
      }
    />
  );
}
