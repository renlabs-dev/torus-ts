"use client";

import { CircleDollarSign } from "lucide-react";

import { formatToken } from "@torus-network/torus-utils/subspace";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";

interface FeeItem {
  label: string;
  amount: bigint;
  description?: string;
}

interface FeeAlertProps {
  title: string;
  isVisible: boolean;
  isLoading: boolean;
  error?: string | null;
  feeItems: FeeItem[];
  totalAmount: bigint;
  note?: string;
}

export function FeeTooltip({
  title,
  isVisible,
  isLoading,
  error,
  feeItems,
  totalAmount,
  note,
}: FeeAlertProps) {
  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CircleDollarSign className="h-4 w-4" />
        <span className="flex items-center gap-2">
          <span>{title}:</span>
          <strong className="animate-pulse">00.00 TORUS</strong>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <CircleDollarSign className="h-4 w-4" />
        <span>
          {title}: {error}
        </span>
      </div>
    );
  }

  if (feeItems.length === 0) {
    return null;
  }

  const totalInTorus = formatToken(totalAmount);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm w-fit">
            <CircleDollarSign className="h-4 w-4" />
            <span className="flex items-center gap-2">
              <span>{title}:</span>
              <strong>{totalInTorus} TORUS</strong>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-4">
          <div className="space-y-2">
            <div className="font-medium">{title} Breakdown:</div>
            {feeItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start gap-4"
              >
                <div>
                  <div className="font-medium">{item.label}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  {formatToken(item.amount, 6)} TORUS
                </div>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-medium">
                <span>Total:</span>
                <span>{totalInTorus} TORUS</span>
              </div>
            </div>
            {note && (
              <div className="text-xs text-gray-600 border-t pt-2">{note}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
