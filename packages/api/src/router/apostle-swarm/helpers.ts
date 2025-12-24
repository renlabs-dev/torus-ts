import type { ApiPromise } from "@polkadot/api";
import { queryKeyStakingTo } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { and, eq, isNull } from "@torus-ts/db";
import type { DB } from "@torus-ts/db/client";
import { apostlesSchema } from "@torus-ts/db/schema";
import type { Apostle } from "@torus-ts/db/schema";

/**
 * Stake threshold for community prospect submissions.
 * Users must have at least this amount staked to propose prospects.
 */
export const PROPOSAL_STAKE_THRESHOLD = 1_000_000_000_000n; // TODO: refactor this later, 1 TORUS (12 decimals)

/**
 * Get apostle record by wallet address.
 * Returns null if not found or deleted.
 */
export async function getApostle(
  db: DB,
  walletAddress: string,
): Promise<Apostle | null> {
  const result = await db.query.apostlesSchema.findFirst({
    where: and(
      eq(apostlesSchema.walletAddress, walletAddress),
      isNull(apostlesSchema.deletedAt),
    ),
  });
  return result ?? null;
}

/**
 * Check if wallet address is a registered apostle.
 */
export async function isApostle(
  db: DB,
  walletAddress: string,
): Promise<boolean> {
  const apostle = await getApostle(db, walletAddress);
  return apostle !== null;
}

/**
 * Check if wallet address is an admin apostle.
 */
export async function isAdmin(db: DB, walletAddress: string): Promise<boolean> {
  const apostle = await getApostle(db, walletAddress);
  return apostle?.isAdmin === true;
}

/**
 * Check if wallet address is either an apostle or admin.
 */
export async function isApostleOrAdmin(
  db: DB,
  walletAddress: string,
): Promise<boolean> {
  const apostle = await getApostle(db, walletAddress);
  return apostle !== null;
}

/**
 * Query the total stake for a wallet address from the chain.
 * Returns the sum of all stakes the address has delegated to others.
 */
export async function getStakeOf(
  wsAPI: Promise<ApiPromise>,
  walletAddress: SS58Address,
): Promise<bigint> {
  const api = await wsAPI;

  const [queryError, stakes] = await tryAsync(
    queryKeyStakingTo(api, walletAddress),
  );

  if (queryError !== undefined) {
    console.error(
      "Error querying stake for address:",
      walletAddress,
      queryError,
    );
    throw queryError;
  }

  // Sum all stakes this address has delegated
  let totalStake = 0n;
  for (const { stake } of stakes) {
    totalStake += stake;
  }

  return totalStake;
}

/**
 * Check if wallet has enough stake to submit community proposals.
 */
export async function hasProposalStake(
  wsAPI: Promise<ApiPromise>,
  walletAddress: SS58Address,
): Promise<{ hasEnough: boolean; stake: bigint }> {
  const stake = await getStakeOf(wsAPI, walletAddress);
  return {
    hasEnough: stake >= PROPOSAL_STAKE_THRESHOLD,
    stake,
  };
}
