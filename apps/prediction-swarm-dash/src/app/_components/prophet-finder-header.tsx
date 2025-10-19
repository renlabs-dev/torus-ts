"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";
import { env } from "~/env";

export function ProphetFinderHeader({
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
    <div className="absolute right-2 top-2 z-[100] w-fit">
      <WalletDropdown
        balance={accountFreeBalance.data}
        stakeOut={stakeOut.data}
        accounts={accounts}
        isInitialized={isInitialized}
        selectedAccount={selectedAccount}
        handleLogout={handleLogout}
        handleGetWallets={handleGetWallets}
        handleSelectWallet={handleSelectWallet}
        torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")}
      />
    </div>
  );
}
