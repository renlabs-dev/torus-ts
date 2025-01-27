import { Coins } from "lucide-react";

import { Skeleton } from "@torus-ts/ui";

interface FeeLabelProps {
  isEstimating: boolean;
  estimatedFee: string | null;
}

export function FeeLabel(props: FeeLabelProps) {
  const { isEstimating, estimatedFee } = props;

  if (isEstimating) {
    return <Skeleton className="h-5 w-64" />;
  }
  if (estimatedFee === null) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins size={16} />
        Fill in tx details to estimate fee
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
