import type {
  Prediction,
  TimeWindowParams,
  VerificationClaim,
  VerificationVerdict,
} from "~/lib/api-schemas";
import { useMemo } from "react";
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

export function useAgentDetailedMetrics(
  agentAddress: string,
  timeWindow: TimeWindowParams = {},
): AgentDetailedMetrics {
  // Get agent contribution stats
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useAgentContributionStatsQuery({
    agent_address: agentAddress,
    ...timeWindow,
  });

  // Get recent predictions
  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = usePredictionsQuery({
    agent_address: agentAddress,
    limit: 50,
    ...timeWindow,
  });

  // Get recent verification claims
  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
  } = useVerificationClaimsQuery({
    agent_address: agentAddress,
    limit: 50,
    ...timeWindow,
  });

  // Get recent verification verdicts
  const {
    data: verdictsData,
    isLoading: verdictsLoading,
    error: verdictsError,
  } = useVerificationVerdictsQuery({
    agent_address: agentAddress,
    limit: 50,
    ...timeWindow,
  });

  // Get agent permissions
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsQuery({
    agent_address: agentAddress,
  });

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
    const agentStats = statsData?.agent_contribution_stats[0];

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

// Helper hook for getting specific activity type
export function useAgentActivityByType(
  agentAddress: string,
  activityType: "predictions" | "claims" | "verdicts",
  params: {
    timeWindow?: TimeWindowParams;
    limit?: number;
    offset?: number;
    search?: string;
    sort_order?: "asc" | "desc";
  } = {},
) {
  const {
    timeWindow = {},
    limit = 50,
    offset = 0,
    search,
    sort_order = "desc",
  } = params;
  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = usePredictionsQuery(
    {
      agent_address: agentAddress,
      limit,
      offset,
      search,
      sort_order,
      ...timeWindow,
    },
    {
      enabled: activityType === "predictions",
    },
  );

  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
  } = useVerificationClaimsQuery(
    {
      agent_address: agentAddress,
      limit,
      offset,
      search,
      sort_order,
      ...timeWindow,
    },
    {
      enabled: activityType === "claims",
    },
  );

  const {
    data: verdictsData,
    isLoading: verdictsLoading,
    error: verdictsError,
  } = useVerificationVerdictsQuery(
    {
      agent_address: agentAddress,
      limit,
      offset,
      search,
      sort_order,
      ...timeWindow,
    },
    {
      enabled: activityType === "verdicts",
    },
  );

  return useMemo(() => {
    switch (activityType) {
      case "predictions":
        return {
          data: predictionsData || [],
          isLoading: predictionsLoading,
          error: predictionsError,
        };
      case "claims":
        return {
          data: claimsData || [],
          isLoading: claimsLoading,
          error: claimsError,
        };
      case "verdicts":
        return {
          data: verdictsData || [],
          isLoading: verdictsLoading,
          error: verdictsError,
        };
      default:
        return {
          data: [],
          isLoading: false,
          error: null,
        };
    }
  }, [
    activityType,
    predictionsData,
    claimsData,
    verdictsData,
    predictionsLoading,
    claimsLoading,
    verdictsLoading,
    predictionsError,
    claimsError,
    verdictsError,
  ]);
}
