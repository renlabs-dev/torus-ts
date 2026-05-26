"use client";

import { withdrawFromTorusEvm } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { torusEvm } from "~/lib/chain";
import { useState } from "react";
import { useWaitForTransactionReceipt, useWalletClient } from "wagmi";

export type WithdrawState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "pending"; txHash: `0x${string}` }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string };

export function useWithdraw(): {
  state: WithdrawState;
  submit: (ss58: string, amount: bigint) => Promise<void>;
  reset: () => void;
} {
  const { data: walletClient } = useWalletClient({ chainId: torusEvm.id });
  const [submissionState, setSubmissionState] = useState<WithdrawState>({
    status: "idle",
  });
  const pendingTxHash =
    submissionState.status === "pending" ? submissionState.txHash : undefined;

  const { data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    chainId: torusEvm.id,
    hash: pendingTxHash,
    confirmations: 2,
    query: { enabled: pendingTxHash !== undefined },
  });

  const state: WithdrawState =
    pendingTxHash !== undefined && receiptError !== null
      ? { status: "error", error: receiptError.message }
      : pendingTxHash !== undefined && receipt?.status === "success"
        ? { status: "success", txHash: pendingTxHash }
        : pendingTxHash !== undefined && receipt?.status === "reverted"
          ? { status: "error", error: "Withdrawal transaction reverted" }
          : submissionState;

  const submit = async (ss58: string, amount: bigint) => {
    if (walletClient === undefined) {
      setSubmissionState({ status: "error", error: "Wallet not connected" });
      return;
    }

    setSubmissionState({ status: "signing" });

    const [error, txHash] = await tryAsync(
      withdrawFromTorusEvm(
        walletClient,
        torusEvm,
        ss58 as SS58Address,
        amount,
        async () => undefined,
      ),
    );

    if (error !== undefined) {
      setSubmissionState({ status: "error", error: error.message });
      return;
    }

    setSubmissionState({ status: "pending", txHash });
  };

  const reset = () => setSubmissionState({ status: "idle" });

  return { state, submit, reset };
}
