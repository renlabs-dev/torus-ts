"use client";

import { CreditCard } from "lucide-react";

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
import { NoWalletExtensionDisplay } from "../no-wallet-extension-display";
import { ScrollArea } from "../scroll-area";
import { WalletAccountDetails } from "./wallet-account-details";
import type { InjectedAccountWithMeta } from "./wallet-dropdown";

interface WalletSelectProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  handleGetWallets: () => Promise<void>;
  handleWalletSelection: (accountAddress: string) => void;
  torusChainEnv: string;
  totalBalance: (account: InjectedAccountWithMeta) => bigint;
}

export const WalletSelect = ({
  accounts,
  handleGetWallets,
  handleWalletSelection,
  torusChainEnv,
  totalBalance,
}: WalletSelectProps) => (
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
        <ScrollArea className={cn("max-h-48 overflow-y-auto")}>
          <DropdownMenuRadioGroup
            value={""}
            onValueChange={handleWalletSelection}
          >
            {accounts?.map((account) => (
              <DropdownMenuRadioItem
                key={account.address}
                value={account.address}
                className={cn("rounded-radius")}
              >
                <WalletAccountDetails
                  account={account}
                  totalBalance={totalBalance}
                />
              </DropdownMenuRadioItem>
            ))}
            {accounts?.length === 0 && (
              <NoWalletExtensionDisplay torusChainEnv={torusChainEnv} />
            )}
          </DropdownMenuRadioGroup>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
