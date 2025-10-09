import { useMemo } from "react";
import type {
  Prediction,
  TimeWindowParams,
  VerificationClaim,
  VerificationVerdict,
} from "@/lib/api-schemas";
import { useAgentContributionStatsQuery } from "./use-agent-contribution-stats-query";
import { usePermissionsQuery } from "./use-permissions-query";
import { usePredictionsQuery } from "./use-predictions-query";
import { useVerificationClaimsQuery } from "./use-verification-claims-query";
import { useVerificationVerdictsQuery } from "./use-verification-verdicts-query";

export interface AgentDetailedMetrics {
  // Summary stats
  totalPredictions: number;
  totalVerificationClaims: number;
  totalVerificationVerdicts: number;
  totalTasksClaimed: number;
  totalTasksCompleted: number;

  // Recent activity (last 50 items of each type)
  recentPredictions: Prediction[];
  recentClaims: VerificationClaim[];
  recentVerdicts: VerificationVerdict[];

  // Permissions
  permissions: string[];

  // Loading and error states
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook optimized for comparison page - disables automatic refetching
 * to avoid constant re-renders and network requests during comparison analysis
 */
export function useAgentDetailedMetricsComparison(
  agentAddress: string,
  timeWindow: TimeWindowParams = {},
): AgentDetailedMetrics {
  // Static query options for comparison - no auto refetch
  const staticQueryOptions = {
    refetchInterval: 0, // Disable interval refetch
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  };

  // Get agent contribution stats - static for comparison
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useAgentContributionStatsQuery(
    {
      agent_address: agentAddress,
      ...timeWindow,
    },
    staticQueryOptions,
  );

  // Get recent predictions - static for comparison
  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = usePredictionsQuery(
    {
      agent_address: agentAddress,
      limit: 50,
      ...timeWindow,
    },
    staticQueryOptions,
  );

  // Get recent verification claims - static for comparison
  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
  } = useVerificationClaimsQuery(
    {
      agent_address: agentAddress,
      limit: 50,
      ...timeWindow,
    },
    staticQueryOptions,
  );

  // Get recent verification verdicts - static for comparison
  const {
    data: verdictsData,
    isLoading: verdictsLoading,
    error: verdictsError,
  } = useVerificationVerdictsQuery(
    {
      agent_address: agentAddress,
      limit: 50,
      ...timeWindow,
    },
    staticQueryOptions,
  );

  // Get agent permissions - static for comparison
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsQuery(
    {
      agent_address: agentAddress,
    },
    staticQueryOptions,
  );

  const metrics = useMemo((): AgentDetailedMetrics => {
    const isLoading =
      statsLoading ||
      predictionsLoading ||
      claimsLoading ||
      verdictsLoading ||
      permissionsLoading;

    const error =
      statsError ||
      predictionsError ||
      claimsError ||
      verdictsError ||
      permissionsError;

    // Extract stats from agent contribution data
    const agentStats = statsData?.agent_contribution_stats?.[0];

    return {
      // Summary metrics
      totalPredictions: agentStats?.num_predictions_submitted || 0,
      totalVerificationClaims:
        agentStats?.num_verification_claims_submitted || 0,
      totalVerificationVerdicts:
        agentStats?.num_verification_verdicts_submitted || 0,
      totalTasksClaimed: agentStats?.num_tasks_claimed || 0,
      totalTasksCompleted: agentStats?.num_tasks_completed || 0,

      // Recent activity
      recentPredictions: predictionsData || [],
      recentClaims: claimsData || [],
      recentVerdicts: verdictsData || [],

      // Permissions array
      permissions: permissionsData?.map((p) => p.permission) || [],

      // States
      isLoading,
      error,
    };
  }, [
    statsData,
    predictionsData,
    claimsData,
    verdictsData,
    permissionsData,
    statsLoading,
    predictionsLoading,
    claimsLoading,
    verdictsLoading,
    permissionsLoading,
    statsError,
    predictionsError,
    claimsError,
    verdictsError,
    permissionsError,
  ]);

  return metrics;
}
