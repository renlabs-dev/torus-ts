"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useTransactionsStore } from "~/store/transactions-store";
import {
  exportTransactionsAsCSV,
  exportTransactionsAsJSON,
} from "~/utils/export-transactions";

interface TransactionExportProps {
  walletAddress: string | undefined;
  disabled?: boolean;
}

type ExportFormat = "csv" | "json";

export function TransactionExport({
  walletAddress,
  disabled,
}: TransactionExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { transactions } = useTransactionsStore((state) =>
    state.getTransactionsByWallet(walletAddress),
  );

  const handleExport = async (format: ExportFormat) => {
    if (!walletAddress) {
      toast.error("No wallet address available");
      return;
    }

    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const exportFn =
      format === "csv" ? exportTransactionsAsCSV : exportTransactionsAsJSON;
    exportFn(transactions, walletAddress);
    toast.success(
      `Exported ${transactions.length} transactions as ${format.toUpperCase()}`,
    );
    setIsExporting(false);
  };

  if (!walletAddress || transactions.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="No transactions to export"
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled ?? isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[90]">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
