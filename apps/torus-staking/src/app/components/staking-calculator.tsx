"use client";

import { useMemo } from "react";
import { Calculator, Rocket, ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  ResponsiveContainer,
} from "recharts";

const INITIAL_STAKE = 10000;
const PROJECTED_APR = 15;
const DAILY_COMPOUNDS = 365;
const FORECAST_MONTHS = 12;

interface ProjectedData {
  date: Date;
  projected: number;
  initial: number;
}

const calculateProjectedGrowth = (stake: number, days: number): number => {
  const apr = PROJECTED_APR / 100;
  const compounds = DAILY_COMPOUNDS;
  const timeframe = days / 365;
  // Adding a slight exponential factor for more dramatic growth
  return stake * Math.pow(1 + apr / compounds, compounds * timeframe * 1.2);
};

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short" });
};

const GrowthTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as ProjectedData;
  const gains = data.projected - data.initial;
  const growthRate = (gains / data.initial) * 100;

  return (
    <div className="rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <p className="text-sm font-medium">{formatMonth(data.date)}</p>
      <p className="text-lg font-bold text-primary">
        {Math.floor(data.projected).toLocaleString()} TORUS
      </p>
      <div className="flex items-center gap-1.5 text-emerald-500">
        <ArrowUpRight className="h-4 w-4" />
        <span className="text-sm font-medium">+{growthRate.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export const StakingCalculator: React.FC = () => {
  const projectedGrowth = useMemo(() => {
    const startDate = new Date();
    const data: ProjectedData[] = [];

    for (let i = 0; i <= FORECAST_MONTHS; i++) {
      const days = Math.floor((365 / FORECAST_MONTHS) * i);
      const date = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      data.push({
        date,
        projected: calculateProjectedGrowth(INITIAL_STAKE, days),
        initial: INITIAL_STAKE,
      });
    }
    return data;
  }, []);

  const maxProjected =
    projectedGrowth[projectedGrowth.length - 1]?.projected ?? 0;
  const totalGains = maxProjected - INITIAL_STAKE;
  const projectedReturn = (totalGains / INITIAL_STAKE) * 100;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Projected Growth Potential</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Target {PROJECTED_APR}% APR • Daily Compounding
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 rounded-lg bg-primary/5 p-4">
        {[30, 90, 180, 365].map((days) => {
          const estimated = calculateProjectedGrowth(INITIAL_STAKE, days);
          const profit = estimated - INITIAL_STAKE;
          const percentGain =
            ((estimated - INITIAL_STAKE) / INITIAL_STAKE) * 100;
          return (
            <div key={days} className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{days}d forecast</p>
              <p className="text-lg font-medium">
                {Math.floor(estimated).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <p className="text-sm font-medium">
                  +{Math.floor(profit).toLocaleString()} (
                  {percentGain.toFixed(1)}
                  %)
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={projectedGrowth}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.05}
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
            />
            <Tooltip content={GrowthTooltip} />
            <Area
              type="basis"
              dataKey="projected"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#colorGrowth)"
              tensionX={0.8}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
        <div className="space-y-1">
          <p className="font-medium">Potential Annual Value</p>
          <p className="text-2xl font-bold text-primary">
            Up to {Math.floor(maxProjected).toLocaleString()} TORUS
          </p>
        </div>
        <div className="flex items-center gap-2 text-emerald-500">
          <Rocket className="h-6 w-6" />
          <span className="text-lg font-medium">
            +{projectedReturn.toFixed(1)}% Growth
          </span>
        </div>
      </div>
    </div>
  );
};
