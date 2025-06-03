"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import type { Transaction } from "~/store/transactions-store";

interface TransactionStatusBadgeProps {
  status: Transaction["status"];
}

export function TransactionStatusBadge({
  status,
}: TransactionStatusBadgeProps) {
  const badgeStyles = {
    PENDING: "border-yellow-500 bg-transparent text-yellow-500 text-xs",
    SUCCESS: "border-green-700 bg-transparent text-green-700 text-xs",
    ERROR: "border-red-500 bg-transparent text-red-500 text-xs",
  };

  const styleKey = status.toUpperCase();

  const badgeStyle =
    styleKey === "PENDING" || styleKey === "SUCCESS" || styleKey === "ERROR"
      ? badgeStyles[styleKey]
      : badgeStyles.PENDING;

  return (
    <Badge className={badgeStyle} aria-label={`Transaction status: ${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
