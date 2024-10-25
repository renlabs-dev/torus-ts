"use client";

import type { TooltipProps } from "recharts";
import * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import type { ChartConfig } from "@commune-ts/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
} from "@commune-ts/ui";

export const description = "A donut chart with text";

const chartColors = [
  "hsl(var(--chart-secondary-1))",
  "hsl(var(--chart-secondary-2))",
  "hsl(var(--chart-secondary-3))",
  "hsl(var(--chart-secondary-4))",
  "hsl(var(--chart-secondary-5))",
];

interface SubnetData {
  subnetName: string;
  stakeWeight: number;
  percWeight: number;
  percFormat: string;
}

interface SubnetPieChartProps {
  chartData: SubnetData[];
}

const chartConfig = {
  stakeWeight: {
    label: "stakeWeight",
  },
  subnetName: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const getFillColor = (index: number) => {
  return chartColors[index % chartColors.length];
};

const CustomTooltipContent: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (active && payload?.length) {
    const { subnetName, percWeight } = payload[0]?.payload as SubnetData;
    const percentage = (percWeight * 100).toFixed(2);
    return (
      <Card className="flex justify-between gap-3 rounded-md p-2">
        <p className="font-bold text-cyan-500">{subnetName}</p>
        <p>{percentage}%</p>
      </Card>
    );
  }
  return null;
};

export function SubnetPieChart({ chartData }: SubnetPieChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Current Subnet Allocation</CardTitle>
        <CardDescription>
          Showing aggregated subnet allocation from user inputs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[360px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="percWeight"
              nameKey="subnetName"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getFillColor(index)} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {chartData.length.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Subnets
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
