"use client";

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";
import type { ProofData } from "~/lib/claim-proof-bundle";
import { CLAIM_EIP712_DOMAIN, CLAIM_EIP712_TYPES } from "~/lib/eip712";
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
        domain: { ...CLAIM_EIP712_DOMAIN, verifyingContract: contractAddress },
        types: CLAIM_EIP712_TYPES,
        primaryType: "Claim",
        message: {
          index: BigInt(proof.index),
          account: proof.account,
          recipient,
          amount: BigInt(proof.amountRaw),
        },
      }),
    );

    if (signError !== undefined) {
      setState({ status: "error", error: signError.message });
      return;
    }

    setState({ status: "submitting" });

    const body = {
      index: proof.index,
      account: proof.account,
      recipient,
      amountRaw: proof.amountRaw,
      proof: proof.proof,
      signature,
    };

    const [fetchError, response] = await tryAsync(
      fetch("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    if (fetchError !== undefined) {
      setState({ status: "error", error: fetchError.message });
      return;
    }

    if (!response.ok) {
      const [jsonError, data] = await tryAsync(
        response.json() as Promise<{ error: string; detail?: string }>,
      );
      const msg =
        jsonError !== undefined
          ? `HTTP ${response.status}`
          : (data.detail ?? data.error);
      setState({ status: "error", error: msg });
      return;
    }

    const [jsonError, data] = await tryAsync(
      response.json() as Promise<{ txHash: `0x${string}` }>,
    );

    if (jsonError !== undefined) {
      setState({ status: "error", error: "Invalid relay response" });
      return;
    }

    setState({ status: "submitted", txHash: data.txHash });
  };

  const reset = () => setState({ status: "idle" });

  return { state, sign, reset };
}
