"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@torus-ts/ui/components/sheet";
import { useWallet } from "~/context/wallet-provider";
import { ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
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
      const timer = setTimeout(() => setShouldRenderContent(false), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild disabled={!selectedAccount}>
        <Button
          size="sm"
          variant="default"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg md:bottom-16"
        >
          <ReceiptText size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-400px] z-[70] flex h-full flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">
            Transactions
          </SheetTitle>

          <p>View your recent transactions</p>
        </SheetHeader>
        <div className="px-4">
          {shouldRenderContent && selectedAccount && (
            <Transactions selectedAccount={selectedAccount} />
          )}
          {shouldRenderContent && !selectedAccount && (
            <div className="text-muted-foreground flex flex-1 items-center justify-center">
              No account selected
            </div>
          )}
          {isOpen && !shouldRenderContent && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
