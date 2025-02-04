"use client";

import { Card, Input } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { ArrowUpRight, Calculator, Leaf } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TooltipProps } from "recharts";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTorus } from "@torus-ts/torus-provider";
import { useCachedStakeOut } from "@torus-ts/query-provider/hooks";
import { env } from "~/env";
import { useAPR } from "~/hooks/useAPR";
import { DateTime } from "luxon";

const MONTHLY_COMPOUNDS = 12;
const FORECAST_MONTHS = 24;

interface ProjectedData {
  date: Date;
  projected: number;
  initial: number;
}

const formatMonth = (date: Date, withoutYear?: boolean): string => {
  if (!withoutYear) {
    return DateTime.fromJSDate(date).toLocaleString({
      month: "short",
      year: "2-digit",
      day: "2-digit",
    });
  }

  return DateTime.fromJSDate(date).toLocaleString({
    month: "short",
    day: "2-digit",
  });
};

const GrowthTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as ProjectedData;
  const gains = data.projected - data.initial;
  const growthRate = (gains / data.initial) * 100;

  return (
    <div className="border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <p className="text-sm text-muted-foreground">{formatMonth(data.date)}</p>
      <p className="text-lg font-bold">
        {Math.floor(data.projected).toLocaleString()} TORUS
      </p>
      <div className="flex items-center gap-1.5">
        <ArrowUpRight className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-500">
          +{growthRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const StakingCalculator: React.FC = () => {
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

  const calculateProjectedGrowth = (stake: number, months: number): number => {
    const aprRate = projectedApr / 100;
    const compounds = MONTHLY_COMPOUNDS;
    const timeframe = months / 12;
    return (
      stake * Math.pow(1 + (aprRate * 1.2) / compounds, compounds * timeframe)
    );
  };

  const projectedGrowth = useMemo(() => {
    const startDate = new Date();
    const data: ProjectedData[] = [];
    const initialAmount = Number(customAmount) || actualStakedBalance;

    for (let i = 0; i <= FORECAST_MONTHS; i++) {
      const date = new Date(startDate.setMonth(startDate.getMonth() + 1));
      data.push({
        date: new Date(date),
        projected: calculateProjectedGrowth(initialAmount, i),
        initial: initialAmount,
      });
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customAmount,
    actualStakedBalance,
    calculateProjectedGrowth,
    projectedApr,
  ]);

  const maxProjected =
    projectedGrowth[projectedGrowth.length - 1]?.projected ?? 0;
  const initialAmount = Number(customAmount) || actualStakedBalance;
  const totalGains = maxProjected - initialAmount;
  const projectedReturn = (totalGains / (initialAmount || 1)) * 100;

  return (
    <Card className="mx-auto mb-16 w-full p-6">
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-0">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Yield Projections</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Projected{" "}
          <span className="font-semibold text-violet-500">
            {projectedApr.toFixed(1)}% APR
          </span>{" "}
          • Monthly Compounding
        </p>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4 border bg-[#080808] pr-4">
        <Input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="max-w-[200px] border-b-0 border-l-0 border-r border-t-0"
          placeholder="Enter TORUS amount"
        />
        <p className="text-sm text-muted-foreground">
          You can edit the amount to see how it affects your projected growth
        </p>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 bg-muted/50 px-4 py-2 md:grid-cols-4">
        {[3, 6, 12, 24].map((months) => {
          const estimated = calculateProjectedGrowth(initialAmount, months);
          const profit = estimated - initialAmount;
          const percentGain = (profit / initialAmount) * 100;
          return (
            <div key={months} className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {months}m forecast
              </p>
              <div className="flex gap-2">
                <p className="text-lg font-medium">
                  {Math.floor(estimated).toLocaleString()}
                </p>
                <p className="text-sm font-medium text-violet-500">
                  +{percentGain.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={projectedGrowth}
            margin={{ top: 15, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="rgb(139, 92, 246)"
                  stopOpacity={0.08}
                />
                <stop
                  offset="95%"
                  stopColor="rgb(139, 92, 246)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(date: Date) => formatMonth(date, true)}
              stroke="#888888"
              fontSize={12}
              tickSize={0}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickSize={0}
              axisLine={false}
              tickFormatter={(value: number) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toFixed(0);
              }}
              domain={[(dataMin: number) => dataMin * 0.95, "dataMax"]}
            />
            <Tooltip content={GrowthTooltip} />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#e2e8f0"
              strokeWidth={1.5}
              fill="url(#colorGrowth)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between bg-muted/50 p-4">
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
            +{projectedReturn.toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
};
