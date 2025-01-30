"use client";

import { useState, useMemo } from "react";
import { Input } from "@torus-ts/ui";
import { Calculator, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_APR = 15; // 15% APR
const COMPOUNDS_PER_YEAR = 365; // Daily compound
const CHART_POINTS = 12; // Reduced for a cleaner view

interface ChartData {
  date: Date;
  balance: number;
  initial: number;
}

const calculateCompoundInterest = (principal: number, days: number): number => {
  const r = SAMPLE_APR / 100;
  const n = COMPOUNDS_PER_YEAR;
  const t = days / 365;
  const amount = principal * Math.pow(1 + r / n, n * t);
  return Number(amount.toFixed(2));
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as ChartData;
  const profit = data.balance - data.initial;
  const profitPercentage = (profit / data.initial) * 100;

  return (
    <div className="rounded-lg border bg-background/95 p-2 shadow-sm">
      <p className="text-sm font-medium">{formatDate(data.date)}</p>
      <p className="text-sm font-bold text-primary">
        {data.balance.toLocaleString()} TORUS
      </p>
      <div className="flex items-center gap-1 text-emerald-500">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs">+{profitPercentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export const StakingCalculator: React.FC = () => {
  const [amount, setAmount] = useState<string>("");

  const chartData = useMemo(() => {
    if (!amount) return [];
    const principal = Number(amount);
    const today = new Date();
    const data: ChartData[] = [];

    for (let i = 0; i <= CHART_POINTS; i++) {
      const days = Math.floor((365 / CHART_POINTS) * i);
      const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      data.push({
        date,
        balance: calculateCompoundInterest(principal, days),
        initial: principal,
      });
    }
    return data;
  }, [amount]);

  const finalValue = chartData[chartData.length - 1]?.balance ?? 0;
  const totalReturn = finalValue - Number(amount);
  const returnPercentage = amount ? (totalReturn / Number(amount)) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-primary" />
          <h3 className="text-sm font-medium">Staking Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {SAMPLE_APR}% APR with daily compound
        </p>
      </div>

      <Input
        type="number"
        placeholder="Enter amount of TORUS"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <AnimatePresence>
        {amount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-4 gap-2 rounded-lg bg-primary/5 p-3">
              {[30, 90, 180, 365].map((days) => {
                const futureValue = calculateCompoundInterest(Number(amount), days);
                const profit = futureValue - Number(amount);
                return (
                  <div key={days} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{days}d</p>
                    <p className="text-sm font-medium">
                      {Math.floor(futureValue).toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-500">
                      +{Math.floor(profit).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.15}
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
                    tickFormatter={formatDate}
                    stroke="#888888"
                    fontSize={10}
                    tickSize={0}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickSize={0}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip content={CustomTooltip} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Projected Annual Return</p>
                <p className="text-lg font-bold text-primary">
                  {Math.floor(finalValue).toLocaleString()} TORUS
                </p>
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  +{returnPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
