import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useEffect, useState } from "react";

export interface ProofData {
  index: number;
  account: string;
  amount: string;
  amountRaw: string;
  proof: `0x${string}`[];
}

export type ProofState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; data: ProofData }
  | { status: "not-found" }
  | { status: "error"; error: Error };

export function useProof(address: `0x${string}` | undefined): ProofState {
  const [state, setState] = useState<ProofState>({ status: "idle" });

  useEffect(() => {
    if (address === undefined) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    const controller = new AbortController();

    void (async () => {
      const [fetchError, response] = await tryAsync(
        fetch(`/proofs/${address.toLowerCase()}.json`, {
          signal: controller.signal,
        }),
      );

      if (fetchError !== undefined) {
        if ((fetchError as Error).name === "AbortError") return;
        setState({ status: "error", error: fetchError });
        return;
      }

      if (response.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      if (!response.ok) {
        setState({
          status: "error",
          error: new Error(`Proof fetch failed: HTTP ${response.status}`),
        });
        return;
      }

      const [jsonError, data] = await tryAsync(
        response.json() as Promise<ProofData>,
      );

      if (jsonError !== undefined) {
        setState({ status: "error", error: jsonError });
        return;
      }

      setState({ status: "found", data });
    })();

    return () => {
      controller.abort();
    };
  }, [address]);

  return state;
}
