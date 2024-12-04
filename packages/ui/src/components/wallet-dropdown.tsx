"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import {
  Copy,
  CreditCard,
  LoaderCircle,
  Lock,
  LockOpen,
  LogOut,
  SquareArrowOutUpRight,
  WalletCards,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  links,
  ScrollArea,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import type { InjectedAccountWithMeta } from "../types";

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
}

const WalletFunctions = (props: WalletFunctionsProps) => {
  const { balance, children, handleLogout, selectedAccount, stakeOut } = props;

  const userStakeWeight = useMemo(() => {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return 0n;
  }, [stakeOut, selectedAccount]);

  async function copyTextToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    return;
  }

  return (
    <>
      <DropdownMenuLabel className={cn("flex justify-between")}>
        <div className={cn("flex flex-col gap-1")}>
          <span>{selectedAccount?.meta.name}</span>
          <span className={cn("text-xs text-muted-foreground")}>
            {smallAddress(selectedAccount?.address ?? "")}
          </span>
        </div>
        <button
          className={cn("rounded-md py-1")}
          onClick={() => copyTextToClipboard(selectedAccount?.address ?? "")}
        >
          <Copy
            className={cn("text-muted-foreground hover:text-white")}
            size={17}
          />
        </button>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className={cn("flex w-full justify-between")}>
        <span className={cn("flex items-center gap-2")}>
          <LockOpen size={17} />
          Balance
        </span>
        <span className={cn("items-center text-xs text-muted-foreground")}>
          {formatToken(balance ?? 0n)} TOR
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
          {formatToken(userStakeWeight)} TOR
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
  handleGetWallets: () => Promise<void>;
  handleLogout: () => void;
  handleSelectWallet: (accountAddress: InjectedAccountWithMeta) => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
}

export const WalletDropdown = (props: WalletDropdownProps) => {
  const {
    accounts,
    balance,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    selectedAccount,
    stakeOut,
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

  return (
    <div className="fixed top-0 z-[70] mx-auto w-full max-w-screen-xl justify-end">
      <div className="mx-auto hidden animate-fade-down justify-end px-6 py-3.5 md:flex">
        <DropdownMenu onOpenChange={handleGetAccounts}>
          <DropdownMenuTrigger asChild>
            <WalletCards
              className={cn("!h-6 !w-6 hover:text-muted-foreground")}
            />
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
              >
                <Accordion
                  type="single"
                  collapsible
                  className={cn("m-0 w-full")}
                >
                  <AccordionItem
                    value="switch-wallet"
                    className={cn("border-none")}
                    onClick={handleGetWallets}
                  >
                    <AccordionTrigger
                      className={cn(
                        "rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground hover:no-underline",
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
                                `${selectedAccount.address === account.address && "bg-active"} rounded-md`,
                              )}
                            >
                              <div
                                className={cn(
                                  "flex flex-col items-center gap-2",
                                )}
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
                      "rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground hover:no-underline",
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
                      {!accounts && (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 px-1.5 py-2",
                          )}
                        >
                          <LoaderCircle className={cn("rotate animate-spin")} />
                          Loading wallets...
                        </span>
                      )}
                      {accounts?.map((account) => (
                        <DropdownMenuRadioItem
                          key={account.address}
                          value={account.address}
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
                                className={cn("text-xs text-muted-foreground")}
                              >
                                {smallAddress(account.address)}
                              </span>
                            </span>
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
