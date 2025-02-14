import { Skeleton } from "@torus-ts/ui";
import { Coins } from "lucide-react";

interface FeeLabelProps {
  isEstimating: boolean;
  estimatedFee: string | null;
  accountConnected: boolean;
}

export function FeeLabel(props: FeeLabelProps) {
  const { isEstimating, estimatedFee, accountConnected } = props;

  if (isEstimating) {
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
  if (estimatedFee) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins size={16} />
        Estimated fee: {estimatedFee} TORUS
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Coins size={16} />
      Estimated fee: 0 TORUS
    </span>
  );
}
