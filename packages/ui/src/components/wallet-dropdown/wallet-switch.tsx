"use client";

import { CreditCard } from "lucide-react";
import { useCallback } from "react";

import { cn } from "../../lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "../dropdown-menu";
import { ScrollArea } from "../scroll-area";
import { WalletAccountDetails } from "./wallet-account-details";
import type { InjectedAccountWithMeta } from "./wallet-dropdown";

interface WalletSwitchProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  selectedAccount: InjectedAccountWithMeta;
  handleGetWallets: () => Promise<void>;
  handleWalletSelection: (accountAddress: string) => void;
  totalBalance: (account: InjectedAccountWithMeta) => bigint;
}

export const WalletSwitch = ({
  accounts,
  selectedAccount,
  handleGetWallets,
  handleWalletSelection,
  totalBalance,
}: WalletSwitchProps) => {
  const handleAccountSelect = useCallback(
    (accountAddress: string) => (event: Event) => {
      event.preventDefault();
      handleWalletSelection(accountAddress);
    },
    [handleWalletSelection],
  );

  return (
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
            <DropdownMenuRadioGroup value={selectedAccount.address}>
              {accounts?.map((account) => (
                <DropdownMenuRadioItem
                  key={account.address}
                  value={account.address}
                  disabled={selectedAccount.address === account.address}
                  showCopy={selectedAccount.address !== account.address}
                  className={cn(
                    `${selectedAccount.address === account.address && "bg-active"} rounded-radius`,
                  )}
                  onSelect={handleAccountSelect(account.address)}
                >
                  <WalletAccountDetails
                    account={account}
                    totalBalance={totalBalance}
                  />
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
