"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetSubTitle,
  SheetTitle,
  SheetTrigger,
} from "@torus-ts/ui/components/sheet";
import { ReceiptText } from "lucide-react";
import { useWallet } from "~/context/wallet-provider";
import { Transactions } from "./transactions/transactions";

export function TransactionsSheet() {
  const { selectedAccount } = useWallet();

  return (
    <Sheet>
      <SheetTrigger asChild disabled={!selectedAccount}>
        <Button
          size="sm"
          variant="default"
          className="fixed bottom-6 md:bottom-16 right-6 h-12 w-12 rounded-full shadow-lg"
        >
          <ReceiptText size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="z-[70] w-[335px] flex h-full flex-col gap-4"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">
            Transactions
          </SheetTitle>

          <SheetSubTitle>View your recent transactions</SheetSubTitle>
        </SheetHeader>
        <Transactions selectedAccount={selectedAccount} />
      </SheetContent>
    </Sheet>
  );
}
