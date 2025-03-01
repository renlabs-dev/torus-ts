"use client";

import {
  formatToken,
  smallAddress,
  smallWalletName,
} from "@torus-ts/utils/subspace";
import { CreditCard } from "lucide-react";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "../dropdown-menu";

import { cn } from "../../lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";
import { ScrollArea } from "../scroll-area";
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
}: WalletSwitchProps) => (
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
                disabled={selectedAccount.address === account.address}
                showCopy={selectedAccount.address !== account.address}
                className={cn(
                  `${selectedAccount.address === account.address && "bg-active"} rounded-radius`,
                )}
              >
                <div className={cn("flex w-full flex-col gap-2")}>
                  <span
                    className={cn(
                      "flex flex-col items-start justify-start gap-1",
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="truncate">
                        {smallWalletName(
                          account.meta.name ?? "Unnamed Wallet",
                          10,
                        )}
                      </span>
                      <span className="font-mono">{`${formatToken(totalBalance(account))} TORUS`}</span>
                    </span>
                    <span className={cn("text-xs text-muted-foreground")}>
                      {smallAddress(account.address, 13)}
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
);
