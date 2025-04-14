import { FORECAST_PERIODS } from "./staking-calculator";
import {
  calculatePercentGain,
  calculateProjectedGrowth,
  formatPercentage,
} from "./staking-calculator-utils";

interface StakingCalculatorForecastPeriodsProps {
  initialAmount: number;
  projectedApr: number;
  monthlyCompounds: number;
}

export function StakingCalculatorForecastPeriods({
  initialAmount,
  projectedApr,
  monthlyCompounds,
}: StakingCalculatorForecastPeriodsProps) {
  return (
    <div className="bg-muted/50 mb-6 grid grid-cols-1 gap-4 px-4 py-2 md:grid-cols-4">
      {FORECAST_PERIODS.map((months) => {
        const estimated = calculateProjectedGrowth(
          initialAmount,
          months,
          projectedApr,
          monthlyCompounds,
        );
        const percentGain = calculatePercentGain(estimated, initialAmount);
        return (
          <div key={months} className="space-y-1.5">
            <p className="text-muted-foreground text-sm">{months}m forecast</p>
            <div className="flex gap-2">
              <p className="text-lg font-medium">
                {Math.floor(estimated).toLocaleString()}
              </p>
              <p className="text-sm font-medium text-violet-500">
                +{formatPercentage(percentGain)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
