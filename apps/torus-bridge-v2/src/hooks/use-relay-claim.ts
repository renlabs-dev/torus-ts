"use client";

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";
import type { ProofData } from "~/lib/claim-proof-bundle";
import {
  buildClaimTypedData,
  buildRelayClaimRequest,
  submitRelayClaimRequest,
} from "~/lib/relay-claim";
import { useState } from "react";
import { useSignTypedData } from "wagmi";

export type RelayClaimState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "submitting" }
  | { status: "submitted"; txHash: `0x${string}` }
  | { status: "error"; error: string };

export function useRelayClaim(proof: ProofData | undefined): {
  state: RelayClaimState;
  sign: (recipient: `0x${string}`) => Promise<void>;
  reset: () => void;
} {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const [state, setState] = useState<RelayClaimState>({ status: "idle" });
  const { signTypedDataAsync } = useSignTypedData();

  const sign = async (recipient: `0x${string}`) => {
    if (proof === undefined) return;

    setState({ status: "signing" });

    const [signError, signature] = await tryAsync(
      signTypedDataAsync({
        ...buildClaimTypedData({
          proof,
          recipient,
          contractAddress,
        }),
      }),
    );

    if (signError !== undefined) {
      setState({ status: "error", error: signError.message });
      return;
    }

    setState({ status: "submitting" });

    const body = buildRelayClaimRequest({
      proof,
      recipient,
      signature,
    });

    const result = await submitRelayClaimRequest(body);
    if (!result.ok) {
      setState({ status: "error", error: result.error });
      return;
    }

    setState({ status: "submitted", txHash: result.txHash });
  };

  const reset = () => setState({ status: "idle" });

  return { state, sign, reset };
}
