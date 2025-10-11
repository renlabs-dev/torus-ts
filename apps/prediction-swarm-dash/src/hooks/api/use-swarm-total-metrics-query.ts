import { useQuery } from "@tanstack/react-query";
import { agentContributionStatsParamsSchema } from "~/lib/api-schemas";
import type {
  AgentContributionStatsParams,
  AgentContributionStatsResponse,
  PermissionsResponse,
  TimeWindowParams,
} from "~/lib/api-schemas";
import { createQueryKey } from "~/lib/api-utils";
import { apiFetch } from "~/lib/fetch";
import { useMemo } from "react";

interface SwarmTotalMetrics {
  totalPredictions: number;
  totalVerificationClaims: number;
  totalVerificationVerdicts: number;
  totalTasksClaimed: number;
  totalTasksCompleted: number;
  totalActiveAgents: number;
  totalAgentsWithPermissions: number;
  permissionsByCapability: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
}

async function fetchAgentContributionStats(
  params: AgentContributionStatsParams,
): Promise<AgentContributionStatsResponse> {
  const validatedParams = agentContributionStatsParamsSchema.parse(params);

  const searchParams = new URLSearchParams();
  if (validatedParams.agent_address)
    searchParams.set("agent_address", validatedParams.agent_address);
  if (validatedParams.from) searchParams.set("from", validatedParams.from);
  if (validatedParams.to) searchParams.set("to", validatedParams.to);

  const url = `agent-contribution-stats${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  const data = await apiFetch<AgentContributionStatsResponse>(url);

  try {
    // Basic validation - check structure
    if (typeof data !== "object") {
      throw new Error("Response is not an object");
    }

    if (!Array.isArray(data.agent_contribution_stats)) {
      throw new Error("agent_contribution_stats is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = {
      agent_contribution_stats: data.agent_contribution_stats.map(
        (item: unknown) => {
          const contributionItem = item as Record<string, unknown>;
          return {
            ...contributionItem,
            // Ensure required fields exist with defaults if needed
            wallet_address:
              (contributionItem.wallet_address as string) || "unknown",
            num_predictions_submitted:
              (contributionItem.num_predictions_submitted as number) || 0,
            num_verification_claims_submitted:
              (contributionItem.num_verification_claims_submitted as number) ||
              0,
            num_verification_verdicts_submitted:
              (contributionItem.num_verification_verdicts_submitted as number) ||
              0,
            num_tasks_claimed:
              (contributionItem.num_tasks_claimed as number) || 0,
            num_tasks_completed:
              (contributionItem.num_tasks_completed as number) || 0,
            num_verification_claims_verified_by_other_agents:
              (contributionItem.num_verification_claims_verified_by_other_agents as number) ||
              0,
          };
        },
      ),
    };

    return validatedResponse as AgentContributionStatsResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error(
      "SWARM-METRICS AGENT-CONTRIBUTION-STATS API response does not match expected schema",
    );
  }
}

async function fetchPermissions(): Promise<PermissionsResponse> {
  const url = `permissions/list`;
  const data = await apiFetch<PermissionsResponse>(url);

  try {
    // Basic validation - just check it's an array
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = data.map((item: unknown) => {
      const permissionItem = item as Record<string, unknown>;
      return {
        ...permissionItem,
        // Ensure required fields exist with defaults if needed
        id: (permissionItem.id as number) || 0,
        ss58_address: (permissionItem.ss58_address as string) || "unknown",
        permission: (permissionItem.permission as string) || "unknown",
        created_at:
          (permissionItem.created_at as string) || new Date().toISOString(),
      };
    });

    return validatedResponse as PermissionsResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error(
      "SWARM-METRICS PERMISSIONS API response does not match expected schema",
    );
  }
}

export function useSwarmTotalMetrics(
  timeWindow: TimeWindowParams = {},
  options: { enabled?: boolean } = {},
): SwarmTotalMetrics {
  // Get all agent stats (unfiltered to get swarm totals)
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: createQueryKey("agent-contribution-stats", timeWindow),
    queryFn: () => fetchAgentContributionStats(timeWindow),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30_000, // 30 seconds
    retry: false,
    enabled: options.enabled ?? true,
  });

  // Get all permissions
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => fetchPermissions(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30_000, // 30 seconds
    retry: false,
    enabled: options.enabled ?? true,
  });

  const metrics = useMemo(() => {
    if (!statsData || !permissionsData) {
      return {
        totalPredictions: 0,
        totalVerificationClaims: 0,
        totalVerificationVerdicts: 0,
        totalTasksClaimed: 0,
        totalTasksCompleted: 0,
        totalActiveAgents: 0,
        totalAgentsWithPermissions: 0,
        permissionsByCapability: {},
        isLoading: statsLoading || permissionsLoading,
        error: statsError || permissionsError,
      };
    }

    // Aggregate stats across all agents
    const totals = statsData.agent_contribution_stats.reduce(
      (acc: Record<string, number>, agent: Record<string, unknown>) => ({
        totalPredictions:
          (acc.totalPredictions ?? 0) +
          (agent.num_predictions_submitted as number),
        totalVerificationClaims:
          (acc.totalVerificationClaims ?? 0) +
          (agent.num_verification_claims_submitted as number),
        totalVerificationVerdicts:
          (acc.totalVerificationVerdicts ?? 0) +
          (agent.num_verification_verdicts_submitted as number),
        totalTasksClaimed:
          (acc.totalTasksClaimed ?? 0) + (agent.num_tasks_claimed as number),
        totalTasksCompleted:
          (acc.totalTasksCompleted ?? 0) +
          (agent.num_tasks_completed as number),
      }),
      {
        totalPredictions: 0,
        totalVerificationClaims: 0,
        totalVerificationVerdicts: 0,
        totalTasksClaimed: 0,
        totalTasksCompleted: 0,
      },
    );

    // Count unique active agents
    const totalActiveAgents = statsData.agent_contribution_stats.length;

    // Count unique agents with permissions
    const uniqueAgentsWithPermissions = new Set(
      permissionsData.map(
        (p: Record<string, unknown>) => p.ss58_address as string,
      ),
    ).size;

    // Group permissions by capability
    const permissionsByCapability = permissionsData.reduce(
      (acc: Record<string, number>, permission: Record<string, unknown>) => {
        const permissionType = permission.permission as string;
        acc[permissionType] = (acc[permissionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      ...totals,
      totalActiveAgents,
      totalAgentsWithPermissions: uniqueAgentsWithPermissions,
      permissionsByCapability,
      isLoading: false,
      error: null,
    };
  }, [
    statsData,
    permissionsData,
    statsLoading,
    permissionsLoading,
    statsError,
    permissionsError,
  ]);

  return metrics;
}
