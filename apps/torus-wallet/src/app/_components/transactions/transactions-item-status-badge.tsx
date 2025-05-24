"use client";

import { Badge } from "@torus-ts/ui/components/badge";

interface TransactionStatusBadgeProps {
  status: "pending" | "success" | "error";
}

export function TransactionStatusBadge({
  status,
}: TransactionStatusBadgeProps) {
  const badgeStyles = {
    pending: "border-yellow-500 bg-transparent text-yellow-500 text-xs",
    success: "border-green-700 bg-transparent text-green-700 text-xs",
    error: "border-red-500 bg-transparent text-red-500 text-xs",
    default: "text-xs",
  };

  const styleKey = status in badgeStyles ? status : "default";

  return (
    <Badge
      className={badgeStyles[styleKey]}
      aria-label={`Transaction status: ${status}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
