/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api-augment";

import { useEffect, useState } from "react";

import { ApiPromise, WsProvider } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type {
  QueryObserverOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useQueries, useQuery } from "@tanstack/react-query";
import SuperJSON from "superjson";

import type { StakeData } from "@torus-network/sdk/cached-queries";
import { queryCachedStakeOut } from "@torus-network/sdk/cached-queries";
import type {
  Api,
  LastBlock,
  PermissionId,
  Proposal,
  VoteWithStake,
} from "@torus-network/sdk/chain";
import {
  processVotesAndStakes,
  queryAccountsNotDelegatingVotingPower,
  queryAgentApplications,
  queryAgentBurn,
  queryAgents,
  queryBlockEmission,
  queryDaoTreasuryAddress,
  queryExtFee,
  queryFreeBalance,
  queryGlobalGovernanceConfig,
  queryIncentivesRatio,
  queryKeyStakedBy,
  queryKeyStakingTo,
  queryLastBlock,
  queryMinAllowedStake,
  queryNamespaceEntriesOf,
  queryNamespacePathCreationCost,
  queryPermission,
  queryPermissions,
  queryPermissionsByDelegator,
  queryPermissionsByRecipient,
  queryProposals,
  queryRecyclingPercentage,
  queryRewardAllocation,
  queryRewardInterval,
  queryTotalIssuance,
  queryTotalStake,
  queryTreasuryEmissionFee,
  queryUnrewardedProposals,
  queryWhitelist,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import { fetchCustomMetadata } from "@torus-network/sdk/metadata";
import type { SS58Address } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { ListItem, Nullish } from "@torus-network/torus-utils/typing";

const log = BasicLogger.create({ name: "query-provider" });

// ==== Old Image Node ====

const NS_CREATION_COST_RPC_URL = "wss://api-30.nodes.torus.network";

/**
 * GAMBIARRA: Connect to hardcoded node with old image that exposes RPC method
 * to compute namespace path creation cost and Agent registration burn.
 *
 * TODO: This should be dropped once the main API nodes are updated.
 *
 * https://discord.com/channels/1306654856286699590/1395038210794586183
 * https://linear.app/renlabs-dev/issue/CHAIN-116/check-whats-going-on-with-fp-pallets
 */
async function connectToOldImageNode(): Promise<ApiPromise> {
  const provider = new WsProvider(NS_CREATION_COST_RPC_URL);
  const [error, api] = await tryAsync(ApiPromise.create({ provider }));
  if (error !== undefined) {
    console.error("Error creating API:", error);
    throw error;
  }
  return api;
}

/**
 * Hook for {@link connectToOldImageNode}.
 */
function useOldImageNodeApi(): ApiPromise | null {
  const [api, setApi] = useState<ApiPromise | null>(null);
  useEffect(() => {
    const run = async () => {
      const api = await connectToOldImageNode();
      setApi(api);
    };
    run().catch((e) => {
      console.error("Unexpected error setting up API at :", e);
    });
  }, []);
  return api;
}

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
    queryFn: () => queryAgentBurn(api!),
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

export function useGetTorusPrice(
  options?: Omit<QueryObserverOptions<number, Error>, "queryKey" | "queryFn">,
): UseQueryResult<number, Error> {
  return useQuery<number, Error>({
    queryKey: ["torus-price"],
    queryFn: async (): Promise<number> => {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=torus&vs_currencies=usd";

      // Fetch the data
      const [fetchError, response] = await tryAsync(fetch(url));
      if (fetchError !== undefined) {
        log.error(fetchError.message);
        console.error("Error fetching from Coingecko API:", fetchError);
        throw fetchError;
      }

      // Check response status
      if (!response.ok) {
        throw new Error(`Coingecko API error: ${response.status}`);
      }

      // Parse the JSON
      const [parseError, data] = await tryAsync(response.json());
      if (parseError !== undefined) {
        log.error(parseError.message);
        console.error("Error parsing Coingecko API response:", parseError);
        throw parseError;
      }

      const typedData = data as CoingeckoResponse;

      if (typeof typedData.torus.usd !== "number") {
        throw new Error("Invalid response format from Coingecko API");
      }

      return typedData.torus.usd;
    },
    retry: 1,
    ...options,
  });
}

export function usePermission(
  api: Api | Nullish,
  permId: PermissionId | Nullish,
) {
  return useQuery({
    queryKey: ["permission", permId],
    enabled: api != null && permId != null,
    queryFn: () => queryPermission(api!, permId!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function usePermissions(api: Api | Nullish) {
  return useQuery({
    queryKey: ["permissions"],
    enabled: api != null,
    queryFn: () => queryPermissions(api!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function usePermissionsByDelegator(
  api: Api | Nullish,
  address: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["permissions_by_grantor", address],
    enabled: api != null && address != null,
    queryFn: () => queryPermissionsByDelegator(api!, address!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function usePermissionsByRecipient(
  api: Api | Nullish,
  address: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["permissions_by_grantee", address],
    enabled: api != null && address != null,
    queryFn: () => queryPermissionsByRecipient(api!, address!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useNamespaceEntriesOf(
  api: Api | Nullish,
  agent: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["namespace_entries_of", agent],
    enabled: api != null && agent != null,
    queryFn: () => queryNamespaceEntriesOf(api!, agent!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useNamespacePathCreationCost(
  _api: Api | Nullish,
  account: SS58Address | Nullish,
  path: string | Nullish,
) {
  // GAMBIARRA: connect to hardcoded node with image that exposes RPC method
  const api = useOldImageNodeApi();

  return useQuery({
    queryKey: ["namespace_path_creation_cost", account, path],
    enabled: api != null && account != null && path != null,
    queryFn: () => queryNamespacePathCreationCost(api!, account!, path!),
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useTransactionFee(
  extrinsic: SubmittableExtrinsic<"promise"> | Nullish,
  from: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["transaction_fee", extrinsic?.hash.toString(), from],
    enabled: extrinsic != null && from != null,
    queryFn: async () => {
      const [error, result] = await queryExtFee(extrinsic!, from!);
      if (error) throw error;
      return result.fee;
    },
    staleTime: CONSTANTS.TIME.LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
