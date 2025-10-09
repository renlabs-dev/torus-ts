import type {
  AgentContributionStatsItem,
  Permission,
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

interface AgentProfile {
  summary: AgentContributionStatsItem | null;
  activity: {
    predictions: Prediction[];
    claims: VerificationClaim[];
    verdicts: VerificationVerdict[];
  };
  permissions: Permission[];
  isLoading: boolean;
  error: Error | null;
}

export function useAgentProfile(
  agentAddress: string,
  timeWindow: TimeWindowParams = {},
): AgentProfile {
  // Get agent stats
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useAgentContributionStatsQuery({
    agent_address: agentAddress,
    ...timeWindow,
  });

  // Get agent predictions
  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = usePredictionsQuery({ agent_address: agentAddress, ...timeWindow });

  // Get agent verification claims
  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
  } = useVerificationClaimsQuery({
    agent_address: agentAddress,
    ...timeWindow,
  });

  // Get agent verification verdicts
  const {
    data: verdictsData,
    isLoading: verdictsLoading,
    error: verdictsError,
  } = useVerificationVerdictsQuery({
    agent_address: agentAddress,
    ...timeWindow,
  });

  // Get agent permissions
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsQuery({ agent_address: agentAddress }, {});

  const profile = useMemo((): AgentProfile => {
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

    return {
      summary: statsData?.agent_contribution_stats[0] || null,
      activity: {
        predictions: predictionsData || [],
        claims: claimsData || [],
        verdicts: verdictsData || [],
      },
      permissions: permissionsData || [],
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

  return profile;
}
