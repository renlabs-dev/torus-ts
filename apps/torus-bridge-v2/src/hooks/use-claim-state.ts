import type { UseQueryResult } from "@tanstack/react-query";
import { env } from "~/env";
import { useEvmBalance } from "~/hooks/use-evm-balance";
import type { ProofData, ProofQuery } from "~/hooks/use-proof";
import { shouldOfferNativeWithdrawal } from "~/lib/claim-amounts";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { useReadContract } from "wagmi";

export type ClaimState =
  | { type: "not-connected" }
  | { type: "loading" }
  | { type: "scw-detected" }
  | { type: "not-eligible" }
  | { type: "eligible"; proof: ProofData; amountFormatted: string }
  | { type: "step2-available"; amountFormatted: string; evmBalance: bigint }
  | { type: "already-claimed"; amountFormatted: string }
  | { type: "error"; error: Error };

export function useClaimState({
  connected,
  address,
  proofQuery,
  scwQuery,
}: {
  connected: boolean;
  address: `0x${string}` | undefined;
  proofQuery: ProofQuery;
  scwQuery: UseQueryResult<boolean, Error>;
}): ClaimState {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const proof = proofQuery.data ?? undefined;

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "isClaimed",
    args: proof !== undefined ? [BigInt(proof.index)] : undefined,
    query: {
      enabled:
        proof !== undefined && address !== undefined && scwQuery.data === false,
      refetchInterval: 5_000,
    },
  });

  const { balance: evmBalance, isLoading: isBalanceLoading } =
    useEvmBalance(address);

  if (!connected || address === undefined) {
    return { type: "not-connected" };
  }

  if (proofQuery.isError) {
    return {
      type: "error",
      error: proofQuery.error ?? new Error("Proof query failed"),
    };
  }

  if (scwQuery.isError) {
    return { type: "error", error: scwQuery.error };
  }

  if (
    proofQuery.isPending ||
    scwQuery.isPending ||
    (proof !== undefined && (isClaimedLoading || isBalanceLoading))
  ) {
    return { type: "loading" };
  }

  if (scwQuery.data === true) {
    return { type: "scw-detected" };
  }

  if (proofQuery.data === null) {
    return { type: "not-eligible" };
  }

  if (proof === undefined) {
    return { type: "loading" };
  }

  if (isClaimed === true) {
    if (evmBalance !== undefined && shouldOfferNativeWithdrawal(evmBalance)) {
      return {
        type: "step2-available",
        amountFormatted: proof.amount,
        evmBalance,
      };
    }
    return { type: "already-claimed", amountFormatted: proof.amount };
  }

  return { type: "eligible", proof, amountFormatted: proof.amount };
}
