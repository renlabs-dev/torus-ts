import { env } from "~/env";
import { useClaimProofBundle } from "~/hooks/use-claim-proof-bundle";
import { isSameEvmAddress } from "~/lib/claim-proof-bundle";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { useReadContract } from "wagmi";

export type RootCheckState =
  | { status: "loading" }
  | { status: "ok"; merkleRoot: `0x${string}` }
  | { status: "mismatch"; localRoot: string; contractRoot: string }
  | { status: "error"; error: Error };

export function useMerkleRootCheck(): RootCheckState {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const proofBundleQuery = useClaimProofBundle();
  const proofBundle = proofBundleQuery.data;
  const contractAddressMatches =
    proofBundle === undefined ||
    isSameEvmAddress(contractAddress, proofBundle.deployment.address);

  const {
    data: contractRoot,
    error: contractError,
    isLoading: contractLoading,
  } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "merkleRoot",
    query: {
      enabled: proofBundle !== undefined && contractAddressMatches,
    },
  });

  if (proofBundleQuery.isError) {
    return { status: "error", error: proofBundleQuery.error };
  }

  if (proofBundle !== undefined && !contractAddressMatches) {
    return {
      status: "error",
      error: new Error(
        `Claim proof bundle is for ${proofBundle.deployment.address}, but NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS is ${contractAddress}`,
      ),
    };
  }

  if (contractError !== null) {
    return { status: "error", error: contractError };
  }

  if (
    proofBundle === undefined ||
    contractLoading ||
    contractRoot === undefined
  ) {
    return { status: "loading" };
  }

  if (proofBundle.merkleRoot !== contractRoot) {
    return {
      status: "mismatch",
      localRoot: proofBundle.merkleRoot,
      contractRoot: contractRoot as string,
    };
  }

  return { status: "ok", merkleRoot: proofBundle.merkleRoot };
}
