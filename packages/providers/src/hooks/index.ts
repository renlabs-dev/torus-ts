/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api-augment";

import type { ApiPromise } from "@polkadot/api";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueries, useQuery } from "@tanstack/react-query";

import type {
  Api,
  LastBlock,
  Proposal,
  StakeData,
  VoteWithStake,
} from "@torus-ts/subspace/old";
import type { ListItem } from "@torus-ts/utils/typing";
import { fetchCustomMetadata } from "@torus-ts/subspace/old";
import {
  getModuleBurn,
  getSubnetList,
  processVotesAndStakes,
  queryBalance,
  queryDaosEntries,
  queryDaoTreasuryAddress,
  queryLastBlock,
  queryNotDelegatingVotingPower,
  queryProposalsEntries,
  queryRewardAllocation,
  queryStakeFrom,
  queryStakeOut,
  queryUnrewardedProposals,
  queryUserTotalStaked,
} from "@torus-ts/subspace/queries";

import type { Nullish } from "../types";

import "../utils";

import type { SS58Address } from "@torus-ts/subspace/address";

// == Constants ==

/**
 * == Subspace refresh times ==
 *
 * TODO: these values should be passed as parameters in the functions passed by the apps (env).
 *
 * Time to consider last block query un-fresh. Half block time is the expected
 * time for a new block at a random point in time, so:
 * block_time / 2  ==  8 seconds / 2  ==  4 seconds
 */
export const LAST_BLOCK_STALE_TIME = (1000 * 8) / 2;

/**
 * Time to consider proposals query state un-fresh. They don't change a lot,
 * only when a new proposal is created and people should be able to see new
 * proposals fast enough.
 *
 * 1 minute (arbitrary).
 */
export const PROPOSALS_STALE_TIME = 1000 * 60;

/**
 * Time to consider stake query state un-fresh. They also don't change a lot,
 * only when people move their stake / delegation. That changes the way votes
 * are computed, but only very marginally for a given typical stake change, with
 * a small chance of a relevant difference in displayed state.
 * 5 minutes (arbitrary).
 */
export const STAKE_STALE_TIME = 1000 * 60 * 5; // 5 minutes (arbitrary)

// == Chain ==

export function useLastBlock(
  api: ApiPromise | Nullish,
): UseQueryResult<LastBlock, Error> {
  return useQuery({
    queryKey: ["last_block"],
    enabled: api != null,
    queryFn: () => queryLastBlock(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == System ==

export function useBalance(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["balance", address],
    enabled: api != null && address !== null,
    queryFn: () => queryBalance(api!, address!),
    staleTime: LAST_BLOCK_STALE_TIME,
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
    queryFn: () => queryProposalsEntries(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDaos(api: Api | Nullish) {
  return useQuery({
    queryKey: ["daos"],
    enabled: api != null,
    queryFn: () => queryDaosEntries(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDaoTreasury(
  api: Api | Nullish,
): UseQueryResult<SS58Address, Error> {
  return useQuery({
    queryKey: ["dao_treasury"],
    enabled: api != null,
    queryFn: () => queryDaoTreasuryAddress(api!),
    staleTime: PROPOSALS_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useNotDelegatingVoting(
  api: Api | Nullish,
): UseQueryResult<SS58Address[], Error> {
  return useQuery({
    queryKey: ["not_delegating_voting_power"],
    enabled: api != null,
    queryFn: () => queryNotDelegatingVotingPower(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUnrewardedProposals(api: Api | Nullish) {
  return useQuery({
    queryKey: ["unrewarded_proposals"],
    enabled: api != null,
    queryFn: () => queryUnrewardedProposals(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useRewardAllocation(api: Api | Nullish) {
  return useQuery({
    queryKey: ["reward_allocation"],
    enabled: api != null,
    queryFn: () => queryRewardAllocation(api!),
    staleTime: LAST_BLOCK_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Subspace Module ==

export function useAllStakeOut(
  torusCacheUrl: string,
): UseQueryResult<StakeData, Error> {
  return useQuery({
    queryKey: ["stake_out"],
    queryFn: () => queryStakeOut(torusCacheUrl),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useStakeFrom(
  torusCacheUrl: string,
): UseQueryResult<StakeData, Error> {
  return useQuery({
    queryKey: ["stake_from"],
    queryFn: () => queryStakeFrom(torusCacheUrl),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useProcessVotesAndStakes(
  api: Api | Nullish,
  torusCacheUrl: string,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
): UseQueryResult<VoteWithStake[], Error> {
  return useQuery({
    queryKey: ["process_votes_and_stakes"],
    enabled: api != null,
    queryFn: () =>
      processVotesAndStakes(api!, torusCacheUrl, votesFor, votesAgainst),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUserTotalStaked(
  api: Api | Nullish,
  address: SS58Address | string | Nullish,
) {
  return useQuery({
    queryKey: ["user_total_staked", address],
    enabled: api != null,
    queryFn: () => queryUserTotalStaked(api!, address!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useSubnetList(api: Api | Nullish) {
  return useQuery({
    queryKey: ["subnet_list"],
    enabled: api != null,
    queryFn: () => getSubnetList(api!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useModuleBurn(api: Api | Nullish) {
  return useQuery({
    queryKey: ["module_burn"],
    enabled: api != null,
    queryFn: () => getModuleBurn(api!),
    staleTime: STAKE_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

// == Custom metadata ==

interface BaseProposal {
  id: number;
  metadata: string;
}

interface BaseDao {
  id: number;
  data: string;
}

export function useCustomMetadata<T extends BaseProposal | BaseDao>(
  kind: "proposal" | "dao",
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
