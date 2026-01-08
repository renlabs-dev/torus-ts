"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import Link from "next/link";

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
    <header
      className={cn(
        "animate-fade-down border-border fixed z-[70] flex w-full items-center justify-between py-1 pl-4 pr-2",
      )}
    >
      <Link className={cn("flex gap-3 py-1.5 hover:cursor-pointer")} href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Logo" className="h-7 w-7 object-contain" />
      </Link>

      <WalletDropdown
        className="z-50"
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
    </header>
  );
}
