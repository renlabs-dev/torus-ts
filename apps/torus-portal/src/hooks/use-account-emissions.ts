import { api } from "~/trpc/react";

import { useAccountStreamsSummary } from "./use-account-streams";
import { useTokensPerWeek } from "./use-tokens-per-week";

interface UseAccountStreamsProps {
  accountId: string;
}

export function useAccountEmissions(props: UseAccountStreamsProps) {
  const tokensPerWeek = useTokensPerWeek();

  const { data: agentRootEmissions } =
    api.computedAgentWeight.byAgentKey.useQuery({ agentKey: props.accountId });

  const userStreamsSummary = useAccountStreamsSummary({
    accountId: props.accountId,
  });

  const totalIncoming = userStreamsSummary.incoming.totalTokensPerWeek;
  const totalOutgoing = userStreamsSummary.outgoing.totalTokensPerWeek;
  const totalEmissions = totalIncoming - totalOutgoing;
  const rootEmissionsPerc = agentRootEmissions?.percComputedWeight ?? 0;
  const streamEmissionNetworkPerc =
    totalEmissions / tokensPerWeek.baseWeeklyTokens;
  const agentPercentNetwork = rootEmissionsPerc - streamEmissionNetworkPerc;

  return {
    isLoading: tokensPerWeek.isLoading || !agentRootEmissions,
    isError: tokensPerWeek.isError || !agentRootEmissions,
    totalEmissions,
    totalIncoming,
    totalOutgoing,
    agentPercentNetwork,
    agentRootEmissions,
  };
}
