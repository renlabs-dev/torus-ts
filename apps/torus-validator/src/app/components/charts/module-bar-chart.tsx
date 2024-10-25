"use client";

import type { ChartConfig } from "node_modules/@torus-ts/ui/src/components/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
} from "@torus-ts/ui";

export const description = "A bar chart with a custom label";

interface ModuleData {
  moduleName: string;
  stakeWeight: string;
  percWeight: number;
  percFormat: string;
}

interface ModuleBarChartProps {
  chartData: ModuleData[];
}

const chartConfig = {
  percWeight: {
    label: "Stake",
    color: "hsl(var(--chart-1))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function ModuleBarChart({ chartData }: ModuleBarChartProps) {
  const maxPercWeight = Math.max(
    ...chartData.map((module) => module.percWeight),
  );
  const xAxisDomain = [0, maxPercWeight * 1.2];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Module Allocation</CardTitle>
        <CardDescription>
          Showing aggregated module allocation from user inputs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="moduleName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis
              dataKey="percWeight"
              type="number"
              domain={xAxisDomain}
              hide
            />
            <Bar
              dataKey="percWeight"
              layout="vertical"
              fill="var(--color-percWeight)"
              radius={4}
            >
              <LabelList
                dataKey="moduleName"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="percFormat"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
