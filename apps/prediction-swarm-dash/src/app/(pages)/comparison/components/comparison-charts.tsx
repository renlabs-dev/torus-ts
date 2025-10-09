"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import React from "react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@torus-ts/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@torus-ts/ui/components/chart";
import { useAgentDetailedMetricsComparison } from "~/hooks/api/use-agent-detailed-metrics-comparison-query";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { dateToISOStringSafe, formatLargeNumber } from "~/lib/api-utils";

interface ComparisonChartsProps {
  selectedAgents: string[];
  searchFilters: {
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  };
}

const CHART_COLORS = [
  "#ffffff",
  "#ff6b9d",
  "#00ff00",
  "#00ffff",
  "#0088cc",
  "#ff8fb3",
];

interface AgentChartData {
  address: string;
  name: string;
  predictions: number;
  claims: number;
  verdicts: number;
  tasks: number;
  total: number;
  color: string;
  isLoading: boolean;
}

export function ComparisonCharts({
  selectedAgents,
  searchFilters,
}: ComparisonChartsProps) {
  const timeWindow = React.useMemo(
    () => ({
      from: dateToISOStringSafe(searchFilters.from, false),
      to: dateToISOStringSafe(searchFilters.to, true),
    }),
    [searchFilters.from, searchFilters.to]
  );

  return (
    <ComparisonChartsContent
      selectedAgents={selectedAgents}
      timeWindow={timeWindow}
    />
  );
}

function AgentDataCollector({
  agent,
  index,
  timeWindow,
  onDataReady,
}: {
  agent: string;
  index: number;
  timeWindow: { from?: string; to?: string };
  onDataReady: (data: AgentChartData) => void;
}) {
  const { agentName } = useAgentName(agent);
  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    isLoading,
  } = useAgentDetailedMetricsComparison(agent, timeWindow);

  React.useEffect(() => {
    onDataReady({
      address: agent,
      name: agentName,
      predictions: totalPredictions,
      claims: totalVerificationClaims,
      verdicts: totalVerificationVerdicts,
      tasks: totalTasksCompleted,
      total:
        totalPredictions +
        totalVerificationClaims +
        totalVerificationVerdicts +
        totalTasksCompleted,
      color: CHART_COLORS[index % CHART_COLORS.length],
      isLoading,
    });
  }, [
    agent,
    index,
    agentName,
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    isLoading,
    onDataReady,
  ]);

  return null;
}

function ComparisonChartsContent({
  selectedAgents,
  timeWindow,
}: {
  selectedAgents: string[];
  timeWindow: { from?: string; to?: string };
}) {
  const [agentData, setAgentData] = React.useState<AgentChartData[]>([]);
  const [loadedAgents, setLoadedAgents] = React.useState(new Set<string>());

  const handleAgentDataReady = React.useCallback(
    (data: AgentChartData) => {
      setAgentData((prev) => {
        const filtered = prev.filter((item) => item.address !== data.address);
        const updated = [...filtered, data].sort(
          (a, b) =>
            selectedAgents.indexOf(a.address) -
            selectedAgents.indexOf(b.address)
        );
        return updated.filter((agent) =>
          selectedAgents.includes(agent.address)
        );
      });
      setLoadedAgents((prev) => {
        const newLoadedAgents = new Set([...prev, data.address]);
        // Only keep loaded agents that are still selected
        const filteredAgents = new Set<string>();
        newLoadedAgents.forEach((agent) => {
          if (selectedAgents.includes(agent)) {
            filteredAgents.add(agent);
          }
        });
        return filteredAgents;
      });
    },
    [selectedAgents]
  );

  React.useEffect(() => {
    setAgentData((prev) =>
      prev.filter((agent) => selectedAgents.includes(agent.address))
    );
    setLoadedAgents((prev) => {
      const filteredAgents = new Set<string>();
      prev.forEach((agent) => {
        if (selectedAgents.includes(agent)) {
          filteredAgents.add(agent);
        }
      });
      return filteredAgents;
    });
  }, [selectedAgents]);

  const isAnyLoading = agentData.some((agent) => agent.isLoading);
  const allAgentsLoaded = loadedAgents.size === selectedAgents.length;

  if (!allAgentsLoaded || isAnyLoading) {
    return (
      <>
        {selectedAgents.map((agent, index) => (
          <AgentDataCollector
            key={agent}
            agent={agent}
            index={index}
            timeWindow={timeWindow}
            onDataReady={handleAgentDataReady}
          />
        ))}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const getRankingColor = (index: number) => {
    const sortedAgents = [...agentData].sort((a, b) => b.total - a.total);
    const rank =
      sortedAgents.findIndex(
        (agent) => agent.address === agentData[index].address
      ) + 1;

    const rankColors = {
      1: "#fbbf24",
      2: "#9ca3af",
      3: "#fb923c",
    };
    return rankColors[rank as keyof typeof rankColors] || "#60a5fa";
  };

  const totalActivityData = agentData.map((agent, index) => ({
    name: agent.name,
    fullName: agent.name,
    value: agent.total,
    fill: getRankingColor(index),
  }));

  const chartConfig = Object.fromEntries(
    agentData.map((agent, index) => [
      agent.name,
      {
        label: agent.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ])
  ) satisfies ChartConfig;

  return (
    <>
      {/* Data collectors for each agent */}
      {selectedAgents.map((agent, index) => (
        <AgentDataCollector
          key={agent}
          agent={agent}
          index={index}
          timeWindow={timeWindow}
          onDataReady={handleAgentDataReady}
        />
      ))}

      <div className="space-y-6 hidden md:block">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Total Activity Share
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 text-muted-foreground">
              Relative contribution of each agent
            </div>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart width={400} height={300}>
                <defs>
                  <style>{`
                    .recharts-sector:hover {
                      filter: brightness(0.7);
                    }
                    .recharts-pie-labels {
                      pointer-events: none !important;
                    }
                  `}</style>
                </defs>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    `${name}: ${formatLargeNumber(
                      Number(value)
                    )} Total Activity`,
                    "",
                  ]}
                  labelFormatter={() => null}
                  separator=""
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid #ff6b9d",
                    borderRadius: "4px",
                    color: "#ffffff",
                    padding: "8px 12px",
                  }}
                />
                <Pie
                  data={totalActivityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={20}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent, value }) =>
                    `${name}: ${formatLargeNumber(value)} (${(
                      percent * 100
                    ).toFixed(1)}%)`
                  }
                  labelLine={false}
                  stroke="#000000"
                  strokeWidth={2}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
