"use client";

import { useMemo, useState } from "react";
import { Calculator, Leaf, ArrowUpRight, Edit2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  ResponsiveContainer,
} from "recharts";
import { Input, Button } from "@torus-ts/ui";

const PROJECTED_APR = 24;
const MONTHLY_COMPOUNDS = 12;
const FORECAST_MONTHS = 24;

interface ProjectedData {
  date: Date;
  projected: number;
  initial: number;
}

const calculateProjectedGrowth = (stake: number, months: number): number => {
  const apr = PROJECTED_APR / 100;
  const compounds = MONTHLY_COMPOUNDS;
  const timeframe = months / 12;
  return stake * Math.pow(1 + (apr * 1.2) / compounds, compounds * timeframe);
};

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const GrowthTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as ProjectedData;
  const gains = data.projected - data.initial;
  const growthRate = (gains / data.initial) * 100;

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
  const [stakedBalance, setStakedBalance] = useState(10000);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customAmount, setCustomAmount] = useState(stakedBalance.toString());

  const projectedGrowth = useMemo(() => {
    const startDate = new Date();
    const data: ProjectedData[] = [];
    const initialAmount = isCustomizing ? Number(customAmount) : stakedBalance;

    for (let i = 0; i <= FORECAST_MONTHS; i++) {
      const date = new Date(startDate.setMonth(startDate.getMonth() + 1));
      data.push({
        date: new Date(date),
        projected: calculateProjectedGrowth(initialAmount, i),
        initial: initialAmount,
      });
    }
    return data;
  }, [stakedBalance, isCustomizing, customAmount]);

  const maxProjected =
    projectedGrowth[projectedGrowth.length - 1]?.projected ?? 0;
  const initialAmount = isCustomizing ? Number(customAmount) : stakedBalance;
  const totalGains = maxProjected - initialAmount;
  const projectedReturn = (totalGains / initialAmount) * 100;

  return (
    <div className="space-y-5 rounded-xl border bg-card p-6 shadow-lg">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Yield Projections</h3>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            {isCustomizing ? "Use Current Balance" : "Simulate Custom Amount"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Projected{" "}
            <span className="font-semibold text-violet-500">
              {PROJECTED_APR}% APR
            </span>{" "}
            • Monthly Compounding
          </p>
        </div>
      </div>
      {isCustomizing && (
        <div className="flex items-center gap-4">
          <Input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="max-w-[200px]"
            placeholder="Enter TORUS amount"
          />
          <p className="text-sm text-muted-foreground">
            Explore potential yields with different amounts
          </p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4 rounded-lg bg-muted/50 p-4">
        {[3, 6, 12, 24].map((months) => {
          const estimated = calculateProjectedGrowth(initialAmount, months);
          const profit = estimated - initialAmount;
          const percentGain = (profit / initialAmount) * 100;
          return (
            <div key={months} className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {months}m forecast
              </p>
              <p className="text-lg font-medium">
                {Math.floor(estimated).toLocaleString()}
              </p>
              <p className="text-sm font-medium text-violet-500">
                +{percentGain.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={projectedGrowth}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
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
              tickFormatter={formatMonth}
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              domain={[(dataMin) => dataMin * 0.95, "dataMax"]} // Adds 5% padding at the bottom
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
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
        <div className="space-y-1">
          <p className="font-medium">Projected {FORECAST_MONTHS}-Month Value</p>
          <p className="text-2xl font-bold">
            {Math.floor(maxProjected).toLocaleString()} TORUS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-white" />
          <span className="text-lg font-semibold text-violet-500">
            +{projectedReturn.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
