"use client";

import { useCachedStakeOut } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Card } from "@torus-ts/ui/components/card";
import { formatToken } from "@torus-network/torus-utils";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { env } from "~/env";
import { useAPR } from "~/hooks/useAPR";
import {
  calculatePercentGain,
  calculateProjectedGrowth,
  getInitialAmount,
} from "./staking-calculator-utils";
import { StakingCalculatorHeader } from "./staking-calculator-header";
import { StakingCalculatorAmountInput } from "./staking-calculator-amount-input";
import { StakingCalculatorForecastPeriods } from "./staking-calculator-forecast-periods";
import { StakingCalculatorGrowthChart } from "./staking-calculator-growth-chart";
import { StakingCalculatorSummaryFooter } from "./staking-calculator-summary-footer";

export interface ProjectedData {
  date: Date;
  projected: number;
  initial: number;
}

export const MONTHLY_COMPOUNDS = 12;
export const FORECAST_MONTHS = 24;
export const FORECAST_PERIODS = [3, 6, 12, 24];

function StakingCalculator() {
  const { selectedAccount } = useTorus();
  const { apr } = useAPR();
  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));
  const projectedApr = apr ?? 24;
  const [customAmount, setCustomAmount] = useState("");

  const actualStakedBalance = useMemo(() => {
    if (!selectedAccount?.address || !stakeOut.data?.perAddr) return 0;

    const walletStake = stakeOut.data.perAddr[selectedAccount.address];
    return Number(formatToken(walletStake ?? 0n).replace(/,/g, ""));
  }, [selectedAccount?.address, stakeOut.data]);

  useEffect(() => {
    setCustomAmount(actualStakedBalance.toString());
  }, [actualStakedBalance]);

  const initialAmount = getInitialAmount(customAmount, actualStakedBalance);

  const projectedGrowth = useMemo(() => {
    const data: ProjectedData[] = [];

    for (let i = 0; i <= FORECAST_MONTHS; i++) {
      const date = DateTime.fromJSDate(new Date())
        .plus({ months: i })
        .toJSDate();

      data.push({
        date,
        projected: calculateProjectedGrowth(
          initialAmount,
          i,
          projectedApr,
          MONTHLY_COMPOUNDS,
        ),
        initial: initialAmount,
      });
    }
    return data;
  }, [initialAmount, projectedApr]);

  const maxProjected =
    projectedGrowth[projectedGrowth.length - 1]?.projected ?? 0;

  const projectedReturn = calculatePercentGain(maxProjected, initialAmount);

  return (
    <Card className="mx-auto mb-16 w-full p-6">
      <StakingCalculatorHeader projectedApr={projectedApr} />
      <StakingCalculatorAmountInput
        customAmount={customAmount}
        setCustomAmount={setCustomAmount}
      />
      <StakingCalculatorForecastPeriods
        initialAmount={initialAmount}
        projectedApr={projectedApr}
        monthlyCompounds={MONTHLY_COMPOUNDS}
      />
      <StakingCalculatorGrowthChart projectedGrowth={projectedGrowth} />
      <StakingCalculatorSummaryFooter
        maxProjected={maxProjected}
        projectedReturn={projectedReturn}
      />
    </Card>
  );
}

export { StakingCalculator };
