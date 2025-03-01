"use client";

import { WalletCards } from "lucide-react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu";

import { cn } from "../../lib/utils";
import { WalletActions } from "./wallet-actions";
import { WalletInfo } from "./wallet-info";
import { WalletLabel } from "./wallet-label";
import { WalletSwitch } from "./wallet-switch";
import { WalletSelect } from "./wallet-select";

export type KeypairType = "ed25519" | "sr25519" | "ecdsa" | "ethereum";

export interface InjectedAccountWithMeta {
  address: string;
  meta: { genesisHash?: string | null; name?: string; source: string };
  type?: KeypairType;
  freeBalance?: bigint;
}

export interface StakeOutData {
  total: bigint;
  perAddr: Record<string, bigint>;
  atBlock: bigint;
  atTime: Date;
}

interface WalletDropdownProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  balance: bigint | undefined;
  isInitialized: boolean;
  handleGetWallets: () => Promise<void>;
  handleLogout: () => void;
  handleSelectWallet: (accountAddress: InjectedAccountWithMeta) => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
  shouldDisplayText?: boolean;
}

export const WalletDropdown = (props: WalletDropdownProps) => {
  const {
    accounts,
    balance,
    isInitialized,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    selectedAccount,
    stakeOut,
    shouldDisplayText,
  } = props;

  const handleGetAccounts = async () => {
    if (accounts?.length === 0) {
      await handleGetWallets();
    }
  };

  const handleWalletSelection = (accountAddress: string) => {
    const account = accounts?.find(
      (account) => account.address === accountAddress,
    )!;

    handleSelectWallet(account);
  };

  const getTotalBalance = (
    balance: bigint | null | undefined,
    stake?: bigint | null | undefined,
  ): bigint => (balance ?? 0n) + (stake ?? 0n);

  const totalBalance = useMemo(
    () => (account: InjectedAccountWithMeta) =>
      getTotalBalance(account?.freeBalance, stakeOut?.perAddr[account.address]),
    [stakeOut],
  );

  return (
    <div className="animate-fade-down flex w-fit justify-end py-1">
      <DropdownMenu onOpenChange={handleGetAccounts}>
        <DropdownMenuTrigger disabled={!isInitialized} asChild>
          <button
            className={cn(
              "flex items-center gap-2 bg-background p-2 transition duration-200 hover:bg-background/60",
            )}
          >
            <WalletCards className="!h-5 !w-5" />
            <span className="text-sm">
              <WalletLabel
                selectedAccount={selectedAccount}
                shouldDisplayText={shouldDisplayText}
              />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn("mt-0.5 w-64 border border-muted")}
        >
          {selectedAccount && (
            <>
              <WalletInfo
                selectedAccount={selectedAccount}
                balance={balance}
                stakeOut={stakeOut}
              />
              <WalletSwitch
                accounts={accounts}
                selectedAccount={selectedAccount}
                handleGetWallets={handleGetWallets}
                handleWalletSelection={handleWalletSelection}
                totalBalance={totalBalance}
              />
              <WalletActions handleLogout={handleLogout} />
            </>
          )}
          {!selectedAccount?.address && (
            <WalletSelect
              accounts={accounts}
              handleGetWallets={handleGetWallets}
              handleWalletSelection={handleWalletSelection}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
