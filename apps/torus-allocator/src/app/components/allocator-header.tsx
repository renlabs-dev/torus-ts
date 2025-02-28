"use client";

import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Header } from "@torus-ts/ui/components/header";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";

export function AllocatorHeader({
  torusCacheUrl,
}: Readonly<{ torusCacheUrl: string }>) {
  const {
    accounts,
    api,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    isInitialized,
    selectedAccount,
  } = useTorus();

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const stakeOut = useCachedStakeOut(torusCacheUrl);

  return (
    <Header
      appName="Allocator"
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
