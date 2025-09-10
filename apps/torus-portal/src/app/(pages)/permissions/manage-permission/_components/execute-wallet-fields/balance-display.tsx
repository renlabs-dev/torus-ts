import type { Api } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus";
import { useBalance } from "@torus-ts/query-provider/hooks";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

interface BalanceDisplayProps {
  api: Api | null;
  address: SS58Address;
}

export function BalanceDisplay({ api, address }: BalanceDisplayProps) {
  const { data: balance, isLoading } = useBalance(api, address);

  if (!address) return null;

  if (isLoading) {
    return <Skeleton className="h-4 w-32" />;
  }

  if (!balance) {
    return (
      <span className="text-muted-foreground text-xs">No balance data</span>
    );
  }

  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      <div>Free: {formatToken(balance.free)}</div>
      <div>Staked: {formatToken(balance.staked)}</div>
    </div>
  );
}
