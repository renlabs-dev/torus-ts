import { ArrowUpRight } from "lucide-react";
import type { TooltipProps } from "recharts";
import {
  calculatePercentGain,
  formatMonth,
  formatPercentage,
} from "./staking-calculator-utils";
import type { ProjectedData } from "./staking-calculator";

type StakingCalculatorGrowthTooltipProps = TooltipProps<number, string>;

export function StakingCalculatorGrowthTooltip({
  active,
  payload,
}: StakingCalculatorGrowthTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as ProjectedData;
  const growthRate = calculatePercentGain(data.projected, data.initial);

  return (
    <div
      className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border p-3
        shadow-xl backdrop-blur"
    >
      <p className="text-muted-foreground text-sm">{formatMonth(data.date)}</p>
      <p className="text-lg font-bold">
        {Math.floor(data.projected).toLocaleString()} TORUS
      </p>
      <div className="flex items-center gap-1.5">
        <ArrowUpRight className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-500">
          +{formatPercentage(growthRate)}%
        </span>
      </div>
    </div>
  );
}
