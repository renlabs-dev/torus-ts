"use client";

import { smallAddress } from "@torus-ts/utils/subspace";
import { CreditCard } from "lucide-react";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";

import { cn } from "../lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { NoWalletExtensionDisplay } from "./no-wallet-extension-display";

import { InjectedAccountWithMeta } from "./wallet-dropdown";

interface WalletSelectProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  handleGetWallets: () => Promise<void>;
  handleWalletSelection: (accountAddress: string) => void;
}

export const WalletSelect = ({
  accounts,
  handleGetWallets,
  handleWalletSelection,
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
        <DropdownMenuRadioGroup
          value={""}
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
                  <span className={cn("text-xs text-muted-foreground")}>
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
);
