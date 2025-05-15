import { Button } from "@torus-ts/ui/components/button";
import { SheetTrigger } from "@torus-ts/ui/components/sheet";
import { ReceiptText } from "lucide-react";

interface TransactionsSheetTriggerProps {
  selectedAccount: string | undefined;
}

export function TransactionsSheetTrigger({
  selectedAccount,
}: TransactionsSheetTriggerProps) {
  return (
    <SheetTrigger asChild disabled={!selectedAccount}>
      <Button
        size="sm"
        variant="ghost"
        className="w-full justify-between gap-4 border-none px-3 text-base"
      >
        <span>Transactions</span>
        <ReceiptText size={16} />
      </Button>
    </SheetTrigger>
  );
}