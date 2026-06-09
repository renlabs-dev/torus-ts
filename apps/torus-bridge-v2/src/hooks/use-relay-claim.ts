"use client";

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";
import type { ProofData } from "~/lib/claim-proof-bundle";
import {
  buildClaimTypedData,
  buildRelayClaimRequest,
  submitRelayClaimRequest,
} from "~/lib/relay-claim";
import { ensureWalletOnTorusEvm } from "~/lib/torus-evm-wallet";
import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { getWalletClient } from "wagmi/actions";

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
  const config = useConfig();
  const { connector } = useAccount();

  const sign = async (recipient: `0x${string}`) => {
    if (proof === undefined) return;

    if (connector === undefined) {
      setState({ status: "error", error: "Wallet not connected" });
      return;
    }

    setState({ status: "signing" });

    const [walletClientError, walletClient] = await tryAsync(
      getWalletClient(config, { account: recipient, connector }),
    );

    if (walletClientError !== undefined) {
      setState({ status: "error", error: walletClientError.message });
      return;
    }

    const chainSetup = await ensureWalletOnTorusEvm(walletClient);

    if (!chainSetup.ok) {
      setState({ status: "error", error: chainSetup.error });
      return;
    }

    const [signError, signature] = await tryAsync(
      walletClient.signTypedData(
        buildClaimTypedData({
          proof,
          recipient,
          contractAddress,
        }),
      ),
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
