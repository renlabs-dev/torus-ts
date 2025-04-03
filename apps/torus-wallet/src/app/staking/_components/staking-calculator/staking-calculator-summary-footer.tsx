import { Leaf } from "lucide-react";
import { formatPercentage } from "./staking-calculator-utils";
import { FORECAST_MONTHS } from "./staking-calculator";

interface StakingCalculatorSummaryFooterProps {
  maxProjected: number;
  projectedReturn: number;
}

export function StakingCalculatorSummaryFooter({
  maxProjected,
  projectedReturn,
}: StakingCalculatorSummaryFooterProps) {
  return (
    <div className="bg-muted/50 flex items-center justify-between p-4">
      <div className="flex items-center gap-1 space-y-1">
        <p className="font-medium">
          Projected {FORECAST_MONTHS}-Month Value:{" "}
          <span className="font-bold text-violet-500">
            {Math.floor(maxProjected).toLocaleString()} TORUS
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-white" />
        <span className="text-lg font-semibold text-violet-500">
          +{formatPercentage(projectedReturn)}%
        </span>
      </div>
    </div>
  );
}
