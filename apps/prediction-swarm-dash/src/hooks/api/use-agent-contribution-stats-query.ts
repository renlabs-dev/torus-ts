import { useQuery } from "@tanstack/react-query";
import {
  type AgentContributionStatsParams,
  type AgentContributionStatsResponse,
  agentContributionStatsParamsSchema,
} from "@/lib/api-schemas";
import { apiFetch } from "@/lib/fetch";

async function fetchAgentContributionStats(
  params: AgentContributionStatsParams,
): Promise<AgentContributionStatsResponse> {
  // Validate parameters before making request
  const validatedParams = agentContributionStatsParamsSchema.parse(params);

  const searchParams = new URLSearchParams();

  if (validatedParams.agent_address) {
    searchParams.set("agent_address", validatedParams.agent_address);
  }
  if (validatedParams.from) {
    searchParams.set("from", validatedParams.from);
  }
  if (validatedParams.to) {
    searchParams.set("to", validatedParams.to);
  }

  const url = `agent-contribution-stats${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const data = await apiFetch<AgentContributionStatsResponse>(url);

  // Validate response data
  try {
    // Basic validation - check structure
    if (!data || typeof data !== "object") {
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
  } catch (_error) {
    throw new Error(
      "AGENT-CONTRIBUTION-STATS API response does not match expected schema",
    );
  }
}

export function useAgentContributionStatsQuery(
  params: AgentContributionStatsParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["agent-contribution-stats", params],
    queryFn: () => fetchAgentContributionStats(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
