"use client";

import { useState, useMemo } from "react";
import { Card, Input, Separator } from "@torus-ts/ui";
import { Calculator } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SAMPLE_APR = 12; // 12% APR

interface Period {
  label: string;
  days: number;
}

interface ChartData {
  date: Date;
  balance: number;
  day: number;
}

export const StakingCalculator: React.FC = () => {
  const [amount, setAmount] = useState<string>("");

  const periods: Period[] = [
    { label: "1 Day", days: 1 },
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "1 Year", days: 365 },
  ];

  const calculateCompoundInterest = (principal: number, days: number) => {
    const rate = SAMPLE_APR / 100 / 365;
    const finalAmount = principal * Math.pow(1 + rate, days);
    const rewards = finalAmount - principal;

    return {
      rewards: Number(rewards.toFixed(2)),
      total: Number(finalAmount.toFixed(2)),
    };
  };

  const chartData = useMemo(() => {
    if (!amount) return [];

    const data: ChartData[] = [];
    const principal = Number(amount);
    const today = new Date();

    // Generate data points every 30 days
    for (let day = 0; day <= 365; day += 30) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      data.push({
        day,
        date,
        balance: calculateCompoundInterest(principal, day).total,
      });
    }

    return data;
  }, [amount]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="mt-6 space-y-8 p-8">
      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Return Calculator
        </h3>
      </div>

      <Input
        type="number"
        placeholder="Amount (TORUS)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-9"
      />

      {amount && (
        <>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatDate}
                  interval={0}
                  tick={{ fill: "#888888" }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                  tick={{ fill: "#888888" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-4 shadow-md">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payload[0].payload.date)}
                          </p>
                          <p className="text-lg font-medium">
                            {payload[0].value?.toLocaleString()} TORUS
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Day {payload[0].payload.day}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  dot={{
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    r: 4,
                    fill: "#000000",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Separator className="my-8" />

          <div className="grid grid-cols-4 gap-6">
            {periods.map((period) => {
              const results = calculateCompoundInterest(
                Number(amount),
                period.days,
              );
              return (
                <div key={period.label} className="space-y-3">
                  <p className="text-sm font-medium">{period.label}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Rewards</p>
                      <p className="text-lg font-medium">
                        {results.rewards.toLocaleString()} TORUS
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-medium">
                        {results.total.toLocaleString()} TORUS
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};
