import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { Coins } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

interface FeeLabelProps {
  accountConnected: boolean;
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
  ({ accountConnected }, ref) => {
    const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        updateFee: setEstimatedFee,
        setLoading: setIsLoading,
        getEstimatedFee: () => estimatedFee,
      }),
      [estimatedFee],
    );

    if (isLoading) {
      return <Skeleton className="h-5 w-64" />;
    }

    if (!accountConnected && !estimatedFee) {
      return <FeeMessage>Connect wallet to estimate fee</FeeMessage>;
    }

    if (!estimatedFee) {
      return <FeeMessage>Add recipient to estimate fee</FeeMessage>;
    }

    return <FeeMessage>Estimated fee: {estimatedFee} TORUS</FeeMessage>;
  },
);

FeeLabel.displayName = "FeeLabel";
