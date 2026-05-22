import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";

interface MetaJson {
  merkleRoot: `0x${string}`;
  totalAllocation: string;
  totalAllocationRaw: string;
  claimCount: number;
  contractAddress: string;
  chainId: number;
}

export type RootCheckState =
  | { status: "loading" }
  | { status: "ok"; merkleRoot: `0x${string}` }
  | { status: "mismatch"; localRoot: string; contractRoot: string }
  | { status: "error"; error: Error };

export function useMerkleRootCheck(): RootCheckState {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const [metaRoot, setMetaRoot] = useState<`0x${string}` | undefined>();
  const [metaError, setMetaError] = useState<Error | undefined>();

  useEffect(() => {
    void (async () => {
      const [fetchError, response] = await tryAsync(fetch("/meta.json"));

      if (fetchError !== undefined) {
        setMetaError(fetchError);
        return;
      }

      const [jsonError, meta] = await tryAsync(
        response.json() as Promise<MetaJson>,
      );

      if (jsonError !== undefined) {
        setMetaError(jsonError);
        return;
      }

      setMetaRoot(meta.merkleRoot);
    })();
  }, []);

  const {
    data: contractRoot,
    error: contractError,
    isLoading: contractLoading,
  } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "merkleRoot",
    query: { enabled: metaRoot !== undefined },
  });

  if (metaError !== undefined) {
    return { status: "error", error: metaError };
  }

  if (contractError !== null) {
    return { status: "error", error: contractError };
  }

  if (metaRoot === undefined || contractLoading || contractRoot === undefined) {
    return { status: "loading" };
  }

  if (metaRoot !== contractRoot) {
    return {
      status: "mismatch",
      localRoot: metaRoot,
      contractRoot: contractRoot as string,
    };
  }

  return { status: "ok", merkleRoot: metaRoot };
}
