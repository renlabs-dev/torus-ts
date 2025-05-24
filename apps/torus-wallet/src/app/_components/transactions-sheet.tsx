"use client";

import { useState, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShouldRenderContent(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderContent(false);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
        {shouldRenderContent && selectedAccount && (
          <Transactions selectedAccount={selectedAccount} />
        )}
        {shouldRenderContent && !selectedAccount && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No account selected
          </div>
        )}
        {isOpen && !shouldRenderContent && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
