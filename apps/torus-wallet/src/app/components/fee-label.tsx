import { Skeleton } from "@torus-ts/ui";
import { Coins } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";

interface FeeLabelProps {
  accountConnected: boolean;
}

export interface FeeLabelHandle {
  updateFee: (newFee: string | null) => void;
  setLoading: (loading: boolean) => void;
  getEstimatedFee: () => string | null;
}

export const FeeLabel = forwardRef<FeeLabelHandle, FeeLabelProps>(
  ({ accountConnected }, ref) => {
    const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useImperativeHandle(
      ref,
      () => ({
        updateFee(newFee: string | null) {
          setEstimatedFee(newFee);
        },
        setLoading(loading: boolean) {
          setIsLoading(loading);
        },
        getEstimatedFee() {
          return estimatedFee;
        },
      }),
      [estimatedFee],
    );

    if (isLoading) {
      return <Skeleton className="h-5 w-64" />;
    }

    if (!accountConnected && estimatedFee === null) {
      return (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins size={16} />
          Connect wallet to estimate fee
        </span>
      );
    }

    if (estimatedFee === null) {
      return (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins size={16} />
          Add recipient to estimate fee
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins size={16} />
        Estimated fee: {estimatedFee} TORUS
      </span>
    );
  },
);

FeeLabel.displayName = "FeeLabel";
