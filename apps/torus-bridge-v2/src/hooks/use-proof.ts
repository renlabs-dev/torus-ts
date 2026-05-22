import { useQuery } from "@tanstack/react-query";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { assert } from "tsafe";

export interface ProofData {
  index: number;
  account: string;
  amount: string;
  amountRaw: string;
  proof: `0x${string}`[];
}

export function useProof(address: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ["proof", address],
    queryFn: async () => {
      assert(
        address !== undefined,
        "address is required when proof query is enabled",
      );
      const [fetchError, response] = await tryAsync(
        fetch(`/proofs/${address.toLowerCase()}.json`),
      );

      if (fetchError !== undefined) throw fetchError;

      if (response.status === 404) return null;

      if (!response.ok) {
        throw new Error(`Proof fetch failed: HTTP ${response.status}`);
      }

      const [jsonError, data] = await tryAsync(
        response.json() as Promise<ProofData>,
      );

      if (jsonError !== undefined) throw jsonError;

      return data;
    },
    enabled: address !== undefined,
    retry: false,
    staleTime: Infinity,
  });
}
