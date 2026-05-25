"use client";

import { withdrawFromTorusEvm } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { torusEvm } from "~/lib/chain";
import { useState } from "react";
import { useWalletClient } from "wagmi";

export type WithdrawState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string };

export function useWithdraw(): {
  state: WithdrawState;
  submit: (ss58: string, amount: bigint) => Promise<void>;
  reset: () => void;
} {
  const { data: walletClient } = useWalletClient({ chainId: torusEvm.id });
  const [state, setState] = useState<WithdrawState>({ status: "idle" });

  const submit = async (ss58: string, amount: bigint) => {
    if (walletClient === undefined) {
      setState({ status: "error", error: "Wallet not connected" });
      return;
    }

    setState({ status: "pending" });

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
      setState({ status: "error", error: error.message });
      return;
    }

    setState({ status: "success", txHash });
  };

  const reset = () => setState({ status: "idle" });

  return { state, submit, reset };
}
