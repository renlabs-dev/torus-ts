"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { Header, WalletDropdown } from "@torus-ts/ui";
import type { SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";

export function AllocatorHeader({ torusCacheUrl }: { torusCacheUrl: string }) {
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
          notifyCopy={() => toast.success("Copied to clipboard")}
        />
      }
    />
  );
}
