/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api-augment";
import type { ApiPromise } from "@polkadot/api";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueries, useQuery } from "@tanstack/react-query";
import type {
  Api,
  LastBlock,
  Proposal,
  SS58Address,
  StakeData,
  VoteWithStake,
} from "@torus-network/sdk";
import {
  CONSTANTS,
  fetchCustomMetadata,
  processVotesAndStakes,
  queryAccountsNotDelegatingVotingPower,
  queryAgentApplications,
  queryAgents,
  queryBlockEmission,
  queryBurnValue,
  queryCachedStakeOut,
  queryDaoTreasuryAddress,
  queryFreeBalance,
  queryGlobalGovernanceConfig,
  queryIncentivesRatio,
  queryKeyStakedBy,
  queryKeyStakingTo,
  queryLastBlock,
  queryMinAllowedStake,
  queryProposals,
  queryRecyclingPercentage,
  queryRewardAllocation,
  queryRewardInterval,
  queryTotalIssuance,
  queryTotalStake,
  queryTreasuryEmissionFee,
  queryUnrewardedProposals,
  queryWhitelist,
} from "@torus-network/sdk";
import type { ListItem, Nullish } from "@torus-ts/utils/typing";
import SuperJSON from "superjson";

// -- Subspace refresh times --

// == Chain ==

export function useLastBlock(
  api: Api | ApiPromise | Nullish,
): UseQueryResult<LastBlock, Error> {
  return useQuery({
    queryKey: ["last_block"],
    enabled: api != null,
    queryFn: () => queryLastBlock(api! as ApiPromise),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Balances Module ==

export function useTotalIssuance(api: Api | Nullish) {
  return useQuery({
    queryKey: ["total_issuance"],
    enabled: api != null,
    queryFn: () => queryTotalIssuance(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == System ==

export function useFreeBalance(
  api: Api | Nullish,
  address: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["free_balance", address],
    enabled: api != null && address != null,
    queryFn: () => queryFreeBalance(api!, address!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useTreasuryEmissionFee(
  api: Api | Nullish,
): UseQueryResult<Proposal[], Error> {
  return useQuery({
    queryKey: ["treasury_emission_fee"],
    enabled: api != null,
    queryFn: () => queryTreasuryEmissionFee(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useMinAllowedStake(api: Api | Nullish) {
  return useQuery({
    queryKey: ["min_allowed_stake"],
    enabled: api != null,
    queryFn: () => queryMinAllowedStake(api!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Governance Module ==

export function useProposals(
  api: Api | Nullish,
): UseQueryResult<Proposal[], Error> {
  return useQuery({
    queryKey: ["proposals"],
    enabled: api != null,
    queryFn: () => queryProposals(api!),
    staleTime: CONSTANTS.TIME.PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useAgentApplications(api: Api | Nullish) {
  return useQuery({
    queryKey: ["daos"],
    enabled: api != null,
    queryFn: () => queryAgentApplications(api!),
    staleTime: CONSTANTS.TIME.PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useWhitelist(api: Api | Nullish) {
  return useQuery({
    queryKey: ["whitelist"],
    enabled: api != null,
    queryFn: () => queryWhitelist(api!),
    staleTime: CONSTANTS.TIME.PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useAgents(api: Api | Nullish) {
  return useQuery({
    queryKey: ["agents"],
    enabled: api != null,
    queryFn: () => queryAgents(api!),
    staleTime: CONSTANTS.TIME.PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDaoTreasuryAddress(
  api: Api | Nullish,
): UseQueryResult<SS58Address, Error> {
  return useQuery({
    queryKey: ["dao_treasury"],
    enabled: api != null,
    queryFn: () => queryDaoTreasuryAddress(api!),
    staleTime: CONSTANTS.TIME.PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useAccountsNotDelegatingVoting(
  api: Api | Nullish,
): UseQueryResult<SS58Address[], Error> {
  return useQuery({
    queryKey: ["not_delegating_voting_power"],
    enabled: api != null,
    queryFn: () => queryAccountsNotDelegatingVotingPower(api!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUnrewardedProposals(api: Api | Nullish) {
  return useQuery({
    queryKey: ["unrewarded_proposals"],
    enabled: api != null,
    queryFn: () => queryUnrewardedProposals(api!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useRewardAllocation(api: Api | Nullish) {
  return useQuery({
    queryKey: ["reward_allocation"],
    enabled: api != null,
    queryFn: () => queryRewardAllocation(api!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Torus Module ==

export function useTotalStake(api: Api | Nullish) {
  return useQuery({
    queryKey: ["total_stake"],
    enabled: api != null,
    queryFn: () => queryTotalStake(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useRewardInterval(api: Api | Nullish) {
  return useQuery({
    queryKey: ["reward_interval"],
    enabled: api != null,
    queryFn: () => queryRewardInterval(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Subspace Module ==

export function useCachedStakeOut(
  torusCacheUrl: string,
): UseQueryResult<StakeData, Error> {
  return useQuery({
    queryKey: ["stake_out"],
    queryFn: () => queryCachedStakeOut(torusCacheUrl),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
    // throwOnError: false, // TODO
  });
}

// == Emissions Module ==

export function useRecyclingPercentage(api: Api | Nullish) {
  return useQuery({
    queryKey: ["recycling_percentage"],
    enabled: api != null,
    queryFn: () => queryRecyclingPercentage(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useIncentivesRatio(api: Api | Nullish) {
  return useQuery({
    queryKey: ["incentives_ratio"],
    enabled: api != null,
    queryFn: () => queryIncentivesRatio(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useBlockEmission(api: Api | Nullish) {
  return useQuery({
    queryKey: ["block_emission"],
    enabled: api != null,
    queryFn: () => queryBlockEmission(api!),
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// export function useStakeFrom(
//   torusCacheUrl: string,
// ): UseQueryResult<StakeData, Error> {
//   return useQuery({
//     queryKey: ["stake_from"],
//     queryFn: () => queryStakeFrom(torusCacheUrl),
//     staleTime: STAKE_STALE_TIME,
//     refetchOnWindowFocus: false,
//   });
// }

export function useProcessVotesAndStakes(
  api: Api | Nullish,
  torusCacheUrl: string,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
): UseQueryResult<VoteWithStake[], Error> {
  return useQuery({
    queryKey: ["process_votes_and_stakes", votesFor, votesAgainst],
    enabled: api != null,
    queryFn: () =>
      processVotesAndStakes(api!, torusCacheUrl, votesFor, votesAgainst),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useKeyStakingTo(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["user_total_staked", address],
    enabled: api != null && address != null,
    queryFn: () => queryKeyStakingTo(api!, address! as SS58Address),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useKeyStakedBy(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["user_total_staked", address],
    enabled: api != null && address != null,
    queryFn: () => queryKeyStakedBy(api!, address! as SS58Address),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useBurnValue(api: Api | Nullish) {
  return useQuery({
    queryKey: ["burn_value"],
    enabled: api != null,
    queryFn: () => queryBurnValue(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useGlobalConfig(api: Api | Nullish) {
  return useQuery({
    queryKey: ["network_global_config"],
    enabled: api != null,
    queryFn: () => queryGlobalGovernanceConfig(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export interface BaseProposal {
  id: number;
  metadata: string;
}

export interface BaseDao {
  id: number;
  data: string;
}

export function useCustomMetadata<T extends BaseProposal | BaseDao>(
  kind: "proposal" | "application",
  lastBlock: LastBlock | Nullish,
  items: T[] | undefined,
) {
  type Output = Awaited<ReturnType<typeof fetchCustomMetadata>>;
  const blockNumber = lastBlock?.blockNumber;

  const queries = (items ?? []).map((item) => {
    const id = item.id;
    const metadataField = "metadata" in item ? item.metadata : item.data;
    return {
      queryKey: [{ blockNumber }, "metadata", { kind, id }],
      queryFn: async (): Promise<[number, Output]> => {
        const data = await fetchCustomMetadata(kind, id, metadataField);
        return [id, data];
      },
      refetchOnWindowFocus: false,
      queryKeyHashFn: () => SuperJSON.stringify(metadataField),
    };
  });

  return useQueries({
    queries,
    combine: (results) => {
      const outputs = new Map<number, ListItem<typeof results>>();
      results.forEach((result) => {
        const { data } = result;
        if (data != null) {
          const [id] = data;
          outputs.set(id, result);
        }
      });
      return outputs;
    },
  });
}

// == External API Module ==

// Coingecko
export interface CoingeckoResponse {
  torus: {
    usd: number;
  };
}

// Returns the USD value of Torus Coin
export function useGetTorusPrice() {
  return useQuery<number, Error>({
    queryKey: ["torus-price"],
    queryFn: async () => {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=torus&vs_currencies=usd";
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Coingecko API error: ${response.status}`);
        }

        const data = (await response.json()) as CoingeckoResponse;

        if (typeof data.torus.usd !== "number") {
          throw new Error("Invalid response format from Coingecko API");
        }

        return data.torus.usd;
      } catch (error) {
        console.error("Error fetching Torus price:", error);
        throw error;
      }
    },
    retry: 1,
  });
}
