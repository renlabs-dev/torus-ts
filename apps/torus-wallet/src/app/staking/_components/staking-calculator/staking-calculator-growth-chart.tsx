import { formatMonth } from "./staking-calculator-utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StakingCalculatorGrowthTooltip } from "./staking-calculator-growth-tooltip";
import type { ProjectedData } from "./staking-calculator";

interface StakingCalculatorGrowthChartProps {
  projectedGrowth: ProjectedData[];
}

export function StakingCalculatorGrowthChart({
  projectedGrowth,
}: StakingCalculatorGrowthChartProps) {
  return (
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
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)
            }
            domain={[(dataMin: number) => dataMin * 0.95, "dataMax"]}
          />
          <Tooltip content={<StakingCalculatorGrowthTooltip />} />
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
  );
}
