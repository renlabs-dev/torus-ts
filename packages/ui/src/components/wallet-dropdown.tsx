"use client";

import {
  formatToken,
  smallAddress,
  smallWalletName,
} from "@torus-ts/utils/subspace";
import {
  Copy,
  CreditCard,
  Lock,
  LockOpen,
  LogOut,
  SquareArrowOutUpRight,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { CopyButton } from "./copy-button";

import { links } from "../lib/data";
import { cn } from "../lib/utils";
import { NoWalletExtensionDisplay } from "./no-wallet-extension-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { ScrollArea } from "./scroll-area";

export type KeypairType = "ed25519" | "sr25519" | "ecdsa" | "ethereum";

export interface InjectedAccountWithMeta {
  address: string;
  meta: { genesisHash?: string | null; name?: string; source: string };
  type?: KeypairType;
}

export interface StakeOutData {
  total: bigint;
  perAddr: Record<string, bigint>;
  atBlock: bigint;
  atTime: Date;
}

interface WalletFunctionsProps {
  balance: bigint | undefined;
  children: ReactNode;
  handleLogout: () => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
  notifyCopy: () => void;
}

const WalletFunctions = (props: WalletFunctionsProps) => {
  const {
    balance,
    children,
    handleLogout,
    selectedAccount,
    stakeOut,
    notifyCopy,
  } = props;

  const userStakeWeight = useMemo(() => {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return 0n;
  }, [stakeOut, selectedAccount]);

  return (
    <>
      <DropdownMenuLabel className={cn("flex items-center justify-between")}>
        <div className={cn("flex flex-col gap-1")}>
          <span>{selectedAccount?.meta.name}</span>
          <span className={cn("text-xs text-muted-foreground")}>
            {smallAddress(selectedAccount?.address ?? "")}
          </span>
        </div>
        <CopyButton
          copy={selectedAccount?.address ?? ""}
          className={cn("h-fit p-0 text-muted-foreground hover:text-white")}
          variant="ghost"
          notify={notifyCopy}
        >
          <Copy size={17} />
        </CopyButton>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className={cn("flex w-full justify-between")}>
        <span className={cn("flex items-center gap-2")}>
          <LockOpen size={17} />
          Balance
        </span>
        <span className={cn("items-center text-xs text-muted-foreground")}>
          {formatToken(balance ?? 0n)} TORUS
        </span>
      </DropdownMenuLabel>
      <DropdownMenuLabel
        className={cn("flex w-full items-center justify-between")}
      >
        <span className={cn("flex items-center gap-2")}>
          <Lock size={17} />
          Staked
        </span>
        <span className={cn("text-xs text-muted-foreground")}>
          {formatToken(userStakeWeight)} TORUS
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {children}

      <DropdownMenuSeparator />
      <DropdownMenuItem className={cn("cursor-pointer")}>
        <Link
          href={links.wallet}
          target="_blank"
          className={cn("flex items-center gap-2")}
        >
          <SquareArrowOutUpRight size={17} />
          Wallet Actions
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem className={cn("cursor-pointer")} onClick={handleLogout}>
        <span className={cn("flex items-center gap-2")}>
          <LogOut size={17} />
          Log out
        </span>
      </DropdownMenuItem>
    </>
  );
};

interface WalletDropdownProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  balance: bigint | undefined;
  isInitialized: boolean;
  handleGetWallets: () => Promise<void>;
  handleLogout: () => void;
  handleSelectWallet: (accountAddress: InjectedAccountWithMeta) => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
  notifyCopy: () => void;
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
    notifyCopy,
    shouldDisplayText,
  } = props;

  const handleGetAccounts = async () => {
    if (accounts?.length === 0) {
      await handleGetWallets();
    }
  };

  const handleWalletSelection = (accountAddress: string) => {
    const accountExists = accounts?.find(
      (account) => account.address === accountAddress,
    );

    if (!accountExists) {
      console.error("Account not found");
      return;
    }

    if (selectedAccount && selectedAccount.address === accountExists.address) {
      console.log("Account already selected");
      return;
    }

    handleSelectWallet(accountExists);
  };

  const WalletLabel = () => {
    if (selectedAccount?.address) {
      if (shouldDisplayText) {
        return `Torus (${smallAddress(selectedAccount.address, 6)})`;
      } else if (selectedAccount.meta.name) {
        return smallWalletName(selectedAccount.meta.name, 15);
      } else {
        return smallAddress(selectedAccount.address, 6);
      }
    }
    return `Connect ${shouldDisplayText ? "Torus " : ""}Wallet`;
  };

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
            <span className="text-sm">{WalletLabel()}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn("mt-0.5 w-64 border border-muted")}
        >
          {selectedAccount && (
            <WalletFunctions
              balance={balance}
              handleLogout={handleLogout}
              selectedAccount={selectedAccount}
              stakeOut={stakeOut}
              notifyCopy={notifyCopy}
            >
              <Accordion type="single" collapsible className={cn("m-0 w-full")}>
                <AccordionItem
                  value="switch-wallet"
                  className={cn("border-none")}
                  onClick={handleGetWallets}
                >
                  <AccordionTrigger
                    className={cn(
                      "rounded-radius px-2 py-1.5 hover:bg-accent hover:text-accent-foreground hover:no-underline",
                    )}
                  >
                    <span className={cn("flex items-center gap-2")}>
                      <CreditCard size={17} />
                      Switch Wallet
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className={cn("pb-0")}>
                    <DropdownMenuSeparator />
                    <ScrollArea className={cn("max-h-48 overflow-y-auto")}>
                      <DropdownMenuRadioGroup
                        value={selectedAccount.address}
                        onValueChange={handleWalletSelection}
                      >
                        {accounts?.map((account) => (
                          <DropdownMenuRadioItem
                            key={account.address}
                            value={account.address}
                            disabled={
                              selectedAccount.address === account.address
                            }
                            className={cn(
                              `${selectedAccount.address === account.address && "bg-active"} rounded-radius`,
                            )}
                          >
                            <div
                              className={cn("flex flex-col items-center gap-2")}
                            >
                              <span
                                className={cn(
                                  "flex flex-col items-start justify-start gap-1",
                                )}
                              >
                                <span>{account.meta.name}</span>
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground",
                                  )}
                                >
                                  {smallAddress(account.address)}
                                </span>
                              </span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </WalletFunctions>
          )}

          {!selectedAccount?.address && (
            <Accordion
              type="single"
              collapsible
              defaultValue="select-wallet"
              className={cn("m-0 w-full")}
            >
              <AccordionItem
                value="select-wallet"
                className={cn("border-none")}
                onClick={handleGetWallets}
              >
                <AccordionTrigger
                  className={cn(
                    "rounded-radius px-2 py-1.5 hover:bg-accent hover:text-accent-foreground hover:no-underline",
                  )}
                >
                  <span className={cn("flex items-center gap-2")}>
                    <CreditCard size={17} />
                    Select Wallet
                  </span>
                </AccordionTrigger>
                <AccordionContent className={cn("pb-0")}>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={selectedAccount?.address ?? ""}
                    onValueChange={handleWalletSelection}
                  >
                    {accounts?.map((account) => (
                      <DropdownMenuRadioItem
                        key={account.address}
                        value={account.address}
                      >
                        <div className={cn("flex flex-col items-center gap-2")}>
                          <span
                            className={cn(
                              "flex flex-col items-start justify-start gap-1",
                            )}
                          >
                            <span>{account.meta.name}</span>
                            <span
                              className={cn("text-xs text-muted-foreground")}
                            >
                              {smallAddress(account.address)}
                            </span>
                          </span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                    {accounts?.length === 0 && <NoWalletExtensionDisplay />}
                  </DropdownMenuRadioGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
