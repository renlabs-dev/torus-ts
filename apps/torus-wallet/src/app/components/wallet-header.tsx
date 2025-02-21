"use client";

import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Header } from "@torus-ts/ui/components/header";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown";
import { env } from "~/env";

export function WalletHeader() {
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

  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));

  return (
    <Header
      appName="Torus Wallet"
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
