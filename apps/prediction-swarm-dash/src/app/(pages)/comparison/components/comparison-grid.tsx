"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { LoadingDots } from "~/app/_components/loading-dots";
import { PermissionBadges } from "~/app/_components/permission-badges";
import { RankBadge } from "~/app/_components/rank-badge";
import { env } from "~/env";
import { useAgentDetailedMetricsComparison } from "~/hooks/api/use-agent-detailed-metrics-comparison-query";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { dateToISOStringSafe, formatLargeNumber } from "~/lib/api-utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ComparisonCharts } from "./comparison-charts";

interface ComparisonGridProps {
  selectedAgents: string[];
  searchFilters: {
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  };
}

interface AgentComparisonCardProps {
  agentAddress: string;
  searchFilters: {
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  };
  rank?: number;
}

function AgentComparisonCard({
  agentAddress,
  searchFilters,
  rank,
}: AgentComparisonCardProps) {
  const { agentName } = useAgentName(agentAddress);

  // Helper function to safely convert Date to ISO string
  const toISOStringSafe = (
    date: Date | undefined,
    endOfDay: boolean = false,
  ) => {
    return dateToISOStringSafe(date, endOfDay);
  };

  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    permissions,
    isLoading: metricsLoading,
  } = useAgentDetailedMetricsComparison(agentAddress, {
    from: toISOStringSafe(searchFilters.from, false), // Start of day
    to: toISOStringSafe(searchFilters.to, true), // End of day
  });

  return (
    <Card className="bg-card/50 w-full">
      <CardHeader>
        <CardTitle className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {rank && <RankBadge rank={rank} />}
            {agentName}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {smallAddress(agentAddress)} •
            <PermissionBadges permissions={permissions} variant="compact" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {metricsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingDots size="md" className="text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Activity Score */}

            {/* Metrics Row */}
            <div className="grid grid-cols-2 items-center justify-start gap-6 sm:flex">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {formatLargeNumber(totalPredictions)}
                </span>
                <span className="text-muted-foreground text-sm">
                  /predictions
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {formatLargeNumber(totalVerificationClaims)}
                </span>
                <span className="text-muted-foreground text-sm">/claims</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {formatLargeNumber(totalVerificationVerdicts)}
                </span>
                <span className="text-muted-foreground text-sm">/verdicts</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">
                  {formatLargeNumber(totalTasksCompleted)}
                </span>
                <span className="text-muted-foreground text-sm">/tasks</span>
              </div>
            </div>

            {/* Portal Link */}
            <div className="">
              <Link
                href={`${env("NEXT_PUBLIC_TORUS_PORTAL_URL")}/?id=${agentAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View in portal
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component to collect ranking data without hooks in map
function RankingCalculator({
  selectedAgents,
  searchFilters,
  onRankingReady,
}: {
  selectedAgents: string[];
  searchFilters: ComparisonGridProps["searchFilters"];
  onRankingReady: (rankingMap: Map<string, number>) => void;
}) {
  const [_agentDataForRanking, setAgentDataForRanking] = React.useState<
    {
      address: string;
      name: string;
      totalActivity: number;
      isLoading: boolean;
    }[]
  >([]);

  const handleDataReady = React.useCallback(
    (data: {
      address: string;
      name: string;
      totalActivity: number;
      isLoading: boolean;
    }) => {
      setAgentDataForRanking((prev) => {
        // Remove old data for this agent
        const filtered = prev.filter((item) => item.address !== data.address);

        // Add new data
        const updated = [...filtered, data];

        // Only keep data for agents that are still selected
        const validAgents = updated.filter((agent) =>
          selectedAgents.includes(agent.address),
        );

        return validAgents;
      });
    },
    [selectedAgents],
  );

  // Separate effect to handle ranking calculation
  React.useEffect(() => {
    const loadedValidAgents = _agentDataForRanking.filter(
      (agent) => !agent.isLoading && selectedAgents.includes(agent.address),
    );

    if (loadedValidAgents.length > 0) {
      const rankedAgents = loadedValidAgents.sort(
        (a, b) => b.totalActivity - a.totalActivity,
      );

      const rankingMap = new Map<string, number>();
      rankedAgents.forEach((agent, index) => {
        rankingMap.set(agent.address, index + 1);
      });

      onRankingReady(rankingMap);
    } else if (selectedAgents.length === 0) {
      onRankingReady(new Map());
    }
  }, [_agentDataForRanking, selectedAgents, onRankingReady]);

  // Force recalculation when selectedAgents changes
  React.useEffect(() => {
    setAgentDataForRanking((prev) => {
      // Filter out agents that are no longer selected
      const validAgents = prev.filter((agent) =>
        selectedAgents.includes(agent.address),
      );

      // If we have fewer valid agents than before, immediately recalculate
      if (validAgents.length !== prev.length) {
        const loadedValidAgents = validAgents.filter(
          (agent) => !agent.isLoading,
        );
        if (loadedValidAgents.length > 0) {
          const rankedAgents = loadedValidAgents.sort(
            (a, b) => b.totalActivity - a.totalActivity,
          );

          const rankingMap = new Map<string, number>();
          rankedAgents.forEach((agent, index) => {
            rankingMap.set(agent.address, index + 1);
          });

          onRankingReady(rankingMap);
        } else if (selectedAgents.length === 0) {
          // Clear ranking if no agents selected
          onRankingReady(new Map());
        }
      }

      return validAgents;
    });
  }, [selectedAgents, onRankingReady]);

  return (
    <>
      {selectedAgents.map((agent) => (
        <AgentRankingDataCollector
          key={agent}
          agent={agent}
          searchFilters={searchFilters}
          onDataReady={handleDataReady}
        />
      ))}
    </>
  );
}

function AgentRankingDataCollector({
  agent,
  searchFilters,
  onDataReady,
}: {
  agent: string;
  searchFilters: ComparisonGridProps["searchFilters"];
  onDataReady: (data: {
    address: string;
    name: string;
    totalActivity: number;
    isLoading: boolean;
  }) => void;
}) {
  const { agentName } = useAgentName(agent);
  const toISOStringSafe = (
    date: Date | undefined,
    endOfDay: boolean = false,
  ) => {
    return dateToISOStringSafe(date, endOfDay);
  };

  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    isLoading: metricsLoading,
  } = useAgentDetailedMetricsComparison(agent, {
    from: toISOStringSafe(searchFilters.from),
    to: toISOStringSafe(searchFilters.to),
  });

  const totalActivity =
    totalPredictions +
    totalVerificationClaims +
    totalVerificationVerdicts +
    totalTasksCompleted;

  React.useEffect(() => {
    onDataReady({
      address: agent,
      name: agentName,
      totalActivity,
      isLoading: metricsLoading,
    });
  }, [agent, agentName, totalActivity, metricsLoading, onDataReady]);

  return null;
}

export function ComparisonGrid({
  selectedAgents,
  searchFilters,
}: ComparisonGridProps) {
  const [rankingMap, setRankingMap] = React.useState<Map<string, number>>(
    new Map(),
  );

  const handleRankingReady = React.useCallback(
    (newRankingMap: Map<string, number>) => {
      setRankingMap(newRankingMap);
    },
    [],
  );

  return (
    <div className="w-full space-y-6">
      {/* Ranking calculator - invisible component */}
      <RankingCalculator
        selectedAgents={selectedAgents}
        searchFilters={searchFilters}
        onRankingReady={handleRankingReady}
      />

      {/* Grid Header */}

      {/* Responsive Grid */}
      <div className="mt-6 grid w-full min-w-full grid-cols-1 gap-6 md:grid-cols-2">
        {selectedAgents.map((agent) => (
          <AgentComparisonCard
            key={agent}
            agentAddress={agent}
            searchFilters={searchFilters}
            rank={rankingMap.get(agent)}
          />
        ))}
      </div>

      {/* Comparison Charts */}
      {selectedAgents.length > 1 && (
        <ComparisonCharts
          selectedAgents={selectedAgents}
          searchFilters={searchFilters}
        />
      )}

      {/* Comparison Table for Desktop */}
      {selectedAgents.length > 1 && (
        <Card className="mt-4 hidden lg:block">
          <CardHeader>
            <CardTitle>Metrics Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-4">
              Detailed comparison table for easier analysis
            </div>
            <ComparisonTable
              selectedAgents={selectedAgents}
              searchFilters={searchFilters}
              rankingMap={rankingMap}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComparisonTable({
  selectedAgents,
  searchFilters,
  rankingMap,
}: ComparisonGridProps & { rankingMap: Map<string, number> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-border border-b">
            <th className="p-3 text-center font-medium">Rank</th>
            <th className="p-3 text-left font-medium">Agent</th>
            <th className="p-3 text-center font-medium">Predictions</th>
            <th className="p-3 text-center font-medium">Claims</th>
            <th className="p-3 text-center font-medium">Verdicts</th>
            <th className="p-3 text-center font-medium">Tasks</th>
            <th className="p-3 text-center font-medium">Total</th>
            <th className="p-3 text-center font-medium">Portal</th>
          </tr>
        </thead>
        <tbody>
          {selectedAgents
            .sort((a, b) => {
              const rankA = rankingMap.get(a) || 999;
              const rankB = rankingMap.get(b) || 999;
              return rankA - rankB; // Sort by rank (1st, 2nd, 3rd, etc)
            })
            .map((agent) => (
              <ComparisonTableRow
                key={agent}
                agentAddress={agent}
                searchFilters={searchFilters}
                rank={rankingMap.get(agent)}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonTableRow({
  agentAddress,
  searchFilters,
  rank,
}: AgentComparisonCardProps) {
  const { agentName } = useAgentName(agentAddress);

  const toISOStringSafe = (
    date: Date | undefined,
    endOfDay: boolean = false,
  ) => {
    return dateToISOStringSafe(date, endOfDay);
  };

  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    isLoading: metricsLoading,
  } = useAgentDetailedMetricsComparison(agentAddress, {
    from: toISOStringSafe(searchFilters.from, false), // Start of day
    to: toISOStringSafe(searchFilters.to, true), // End of day
  });

  const totalActivity =
    totalPredictions +
    totalVerificationClaims +
    totalVerificationVerdicts +
    totalTasksCompleted;

  // Function to get rank badge for table
  const getRankBadgeTable = (rank?: number) => {
    if (!rank) return "-";

    return (
      <div className="flex items-center justify-center">
        <RankBadge rank={rank} />
      </div>
    );
  };

  if (metricsLoading) {
    return (
      <tr className="border-border border-b">
        <td colSpan={8} className="p-6 text-center">
          <LoadingDots size="sm" className="text-muted-foreground" />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-border hover:bg-muted/30 border-b">
      <td className="p-3 text-center">{getRankBadgeTable(rank)}</td>
      <td className="p-3">
        <div className="font-medium">{agentName}</div>
        <div className="text-muted-foreground font-mono text-sm">
          {agentAddress.slice(0, 8)}...{agentAddress.slice(-8)}
        </div>
      </td>
      <td className="p-3 text-center font-mono">
        {formatLargeNumber(totalPredictions)}
      </td>
      <td className="p-3 text-center font-mono">
        {formatLargeNumber(totalVerificationClaims)}
      </td>
      <td className="p-3 text-center font-mono">
        {formatLargeNumber(totalVerificationVerdicts)}
      </td>
      <td className="p-3 text-center font-mono">
        {formatLargeNumber(totalTasksCompleted)}
      </td>
      <td className="text-primary p-3 text-center font-mono font-bold">
        {formatLargeNumber(totalActivity)}
      </td>
      <td className="p-3">
        <Link
          href={`${env("NEXT_PUBLIC_TORUS_PORTAL_URL")}/?id=${agentAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm" className="w-full">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </td>
    </tr>
  );
}
