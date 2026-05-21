import { env } from "~/env";
import type { ScwState } from "~/hooks/use-is-scw";
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
  proofStatus,
  proof,
  scwState,
}: {
  connected: boolean;
  address: `0x${string}` | undefined;
  proofStatus: "idle" | "loading" | "found" | "not-found" | "error";
  proof: ProofData | undefined;
  scwState: ScwState;
}): ClaimState {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "isClaimed",
    args: proof !== undefined ? [BigInt(proof.index)] : undefined,
    query: {
      enabled:
        proof !== undefined &&
        address !== undefined &&
        scwState.status === "eoa",
    },
  });

  if (!connected || address === undefined) {
    return { type: "not-connected" };
  }

  if (
    proofStatus === "loading" ||
    proofStatus === "idle" ||
    scwState.status === "loading" ||
    scwState.status === "idle" ||
    (proof !== undefined && isClaimedLoading)
  ) {
    return { type: "loading" };
  }

  if (scwState.status === "scw") {
    return { type: "scw-detected" };
  }

  if (proofStatus === "not-found") {
    return { type: "not-eligible" };
  }

  if (proofStatus === "error") {
    return { type: "error", error: new Error("Failed to load proof data") };
  }

  if (scwState.status === "error") {
    return { type: "error", error: scwState.error };
  }

  if (proof === undefined) {
    return { type: "loading" };
  }

  if (isClaimed === true) {
    return { type: "already-claimed", amountFormatted: proof.amount };
  }

  return { type: "eligible", proof, amountFormatted: proof.amount };
}
