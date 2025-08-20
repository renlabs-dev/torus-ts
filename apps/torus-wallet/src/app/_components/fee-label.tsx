import { forwardRef, useImperativeHandle, useState } from "react";

import { Coins } from "lucide-react";

import { formatToken } from "@torus-network/torus-utils/torus/token";

import { Skeleton } from "@torus-ts/ui/components/skeleton";

interface FeeLabelProps {
  accountConnected: boolean;
  fee?: bigint; // Optional fee prop for simplified usage
}

export interface FeeLabelHandle {
  updateFee: (newFee: string | null) => void;
  setLoading: (loading: boolean) => void;
  getEstimatedFee: () => string | null;
}

function FeeMessage({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-sm">
      <Coins size={16} />
      {children}
    </span>
  );
}

export const FeeLabel = forwardRef<FeeLabelHandle, FeeLabelProps>(
  ({ accountConnected, fee }, ref) => {
    const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Use prop fee when available, otherwise use internal state
    const displayFee = fee !== undefined ? formatToken(fee, 12) : estimatedFee;

    useImperativeHandle(
      ref,
      () => ({
        updateFee: setEstimatedFee,
        setLoading: setIsLoading,
        getEstimatedFee: () => displayFee,
      }),
      [displayFee],
    );

    if (isLoading) {
      return <Skeleton className="h-5 w-64" />;
    }

    if (!accountConnected || !displayFee) {
      return <FeeMessage>Connect wallet to estimate fee</FeeMessage>;
    }

    if (!displayFee) {
      return <FeeMessage>Add recipient to estimate fee</FeeMessage>;
    }

    return <FeeMessage>Transaction fee: {displayFee} TORUS</FeeMessage>;
  },
);

FeeLabel.displayName = "FeeLabel";
