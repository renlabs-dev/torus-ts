import type { SS58Address } from "@torus-network/sdk/types";

import type { Transaction } from "~/store/transactions-store";

export interface ExportableTransaction {
  id: string;
  type: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: string;
  hash?: string;
  createdAt: string;
}

const formatTransactionForExport = (
  transaction: Transaction,
): ExportableTransaction => ({
  id: transaction.id,
  type: transaction.type,
  fromAddress: transaction.fromAddress,
  toAddress: transaction.toAddress,
  amount: transaction.amount,
  fee: transaction.fee,
  status: transaction.status,
  hash: transaction.hash,
  createdAt: transaction.createdAt,
});

const createDownloadLink = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

const generateFilename = (walletAddress: string, extension: string): string => {
  if (
    !walletAddress ||
    typeof walletAddress !== "string" ||
    walletAddress.trim() === ""
  ) {
    throw new Error("Invalid wallet address provided for filename generation");
  }
  return `transactions-${walletAddress.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.${extension}`;
};

export const exportTransactionsAsJSON = (
  transactions: Transaction[],
  walletAddress: string,
): void => {
  if (!transactions.length) return;

  const exportData = {
    walletAddress,
    exportDate: new Date().toISOString(),
    totalTransactions: transactions.length,
    transactions: transactions.map(formatTransactionForExport),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  createDownloadLink(blob, generateFilename(walletAddress, "json"));
};

const escapeCSVField = (field: string | undefined): string =>
  field && (field.includes(",") || field.includes('"') || field.includes("\n"))
    ? `"${field.replace(/"/g, '""')}"`
    : (field ?? "");

export const exportTransactionsAsCSV = (
  transactions: Transaction[],
  walletAddress: string,
): void => {
  if (!transactions.length) return;

  const exportableTransactions = transactions.map(formatTransactionForExport);
  const headers = [
    "ID",
    "Type",
    "From Address",
    "To Address",
    "Amount",
    "Fee",
    "Status",
    "Hash",
    "Created At",
  ];

  const csvRows = [
    headers.map(escapeCSVField).join(","),
    ...exportableTransactions.map((tx) =>
      [
        tx.id,
        tx.type,
        tx.fromAddress,
        tx.toAddress,
        tx.amount,
        tx.fee,
        tx.status,
        tx.hash,
        tx.createdAt,
      ]
        .map(escapeCSVField)
        .join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  createDownloadLink(blob, generateFilename(walletAddress, "csv"));
};

export const getAllTransactionsForWallet = (
  allTransactions: Record<SS58Address, Transaction[]>,
  walletAddress: string,
): Transaction[] => allTransactions[walletAddress as SS58Address] ?? [];
