import type { UseQueryResult } from "@tanstack/react-query";
import { env } from "~/env";
import type { ProofData } from "~/hooks/use-proof";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { useReadContract } from "wagmi";

export type ClaimState =
  | { type: "not-connected" }
  | { type: "loading" }
  | { type: "scw-detected" }
  | { type: "not-eligible" }
  | { type: "eligible"; proof: ProofData; amountFormatted: string }
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
  proofQuery: UseQueryResult<ProofData | null, Error>;
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
    },
  });

  if (!connected || address === undefined) {
    return { type: "not-connected" };
  }

  if (
    proofQuery.isPending ||
    scwQuery.isPending ||
    (proof !== undefined && isClaimedLoading)
  ) {
    return { type: "loading" };
  }

  if (scwQuery.data === true) {
    return { type: "scw-detected" };
  }

  if (proofQuery.data === null) {
    return { type: "not-eligible" };
  }

  if (proofQuery.isError) {
    return { type: "error", error: proofQuery.error };
  }

  if (scwQuery.isError) {
    return { type: "error", error: scwQuery.error };
  }

  if (proof === undefined) {
    return { type: "loading" };
  }

  if (isClaimed === true) {
    return { type: "already-claimed", amountFormatted: proof.amount };
  }

  return { type: "eligible", proof, amountFormatted: proof.amount };
}
