"use client";

import { BorderContainer } from "~/app/_components/border-container";
import { StatCard } from "~/app/_components/stat-card";
import { useSwarmTotalMetrics } from "~/hooks/api";
import type { TimeWindowParams } from "~/lib/api-schemas";

interface DashboardStatsProps {
  timeWindow?: TimeWindowParams;
}

export function DashboardStats({ timeWindow }: DashboardStatsProps) {
  const {
    totalPredictions,
    totalVerificationClaims,
    totalActiveAgents,
    totalVerificationVerdicts,
    isLoading,
    error,
  } = useSwarmTotalMetrics(timeWindow);

  if (error) {
    return (
      <BorderContainer>
        <div className="w-full text-center text-red-500 p-4 h-18">
          ERROR LOADING SWARM METRICS: {error.message}
        </div>
      </BorderContainer>
    );
  }

  const totalActivity =
    totalPredictions +
    totalVerificationClaims +
    totalActiveAgents +
    totalVerificationVerdicts;

  return (
    <BorderContainer>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 items-center w-full sm:h-18">
        <StatCard
          value={totalPredictions}
          label="/total-predictions"
          isLoading={isLoading}
        />
        <StatCard
          value={totalVerificationClaims}
          label="/claims-processed"
          isLoading={isLoading}
        />
        <StatCard
          value={totalVerificationVerdicts}
          label="/verdicts-processed"
          isLoading={isLoading}
        />
        <StatCard
          value={totalActivity}
          label="/total-activity"
          isLoading={isLoading}
          error={!!error}
          errorMessage="/failed-to-load"
        />
        <StatCard
          value={totalActiveAgents}
          label="/writing-to-memory"
          isLoading={isLoading}
          isLastCard={true}
        />
      </div>
    </BorderContainer>
  );
}
