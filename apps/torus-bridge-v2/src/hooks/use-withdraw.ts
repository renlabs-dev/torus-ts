"use client";

import { withdrawFromTorusEvm } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { TORUS_EVM_RPC_URL, torusEvm } from "~/lib/chain";
import {
  getNativeWithdrawAmount,
  shouldOfferNativeWithdrawal,
} from "~/lib/claim-amounts";
import { useState } from "react";
import type { Address, PublicClient, WalletClient } from "viem";
import { formatEther, hexToBigInt, isAddressEqual } from "viem";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";

export type WithdrawState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "signing"; amount: bigint }
  | { status: "pending"; txHash: `0x${string}`; amount: bigint }
  | { status: "success"; txHash: `0x${string}`; amount: bigint }
  | { status: "error"; error: string };

type LiveWithdrawAmount =
  | { type: "ready"; balance: bigint; amount: bigint }
  | { type: "not-ready"; balance: bigint }
  | { type: "error"; error: string };

type ChainSetupResult = { ok: true } | { ok: false; error: string };

type WalletProviderBalance =
  | { type: "ready"; balance: bigint }
  | { type: "error"; error: string };

interface WalletBalanceClient {
  request: (args: {
    method: "eth_getBalance";
    params: [Address, "latest"];
  }) => Promise<`0x${string}`>;
}

const LIVE_BALANCE_READ_ATTEMPTS = 6;
const LIVE_BALANCE_READ_DELAY_MS = 2_000;
const WALLET_BALANCE_READ_ATTEMPTS = 3;
const WALLET_BALANCE_READ_DELAY_MS = 2_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function notReadyMessage(balance: bigint): string {
  const balanceText =
    balance === 0n ? "no TORUS" : `${formatEther(balance)} TORUS`;

  return `No withdrawable balance was found on this EVM wallet after waiting for TorusEVM to update. It currently has ${balanceText} on TorusEVM. Keep the account that received the claim connected and try again in a few seconds.`;
}

function chainSetupMessage(error: string): string {
  return `Could not switch your EVM wallet to Torus EVM. Manually configure chain ID ${torusEvm.id} with RPC ${TORUS_EVM_RPC_URL} and symbol TORUS, then try again. ${error}`;
}

function walletNetworkMismatchMessage({
  torusBalance,
  walletBalance,
}: {
  torusBalance: bigint;
  walletBalance: bigint;
}): string {
  return `Your EVM wallet is using the wrong network config for chain ${torusEvm.id}, likely Action/ACTN. Torus EVM RPC reports ${formatEther(torusBalance)} TORUS, but your wallet provider reports ${formatEther(walletBalance)}. Manually configure Torus EVM with RPC ${TORUS_EVM_RPC_URL} and symbol TORUS, or use MetaMask/Rabby.`;
}

async function readLiveWithdrawAmount(
  publicClient: PublicClient,
  address: Address,
): Promise<LiveWithdrawAmount> {
  let lastBalance = 0n;

  for (let attempt = 0; attempt < LIVE_BALANCE_READ_ATTEMPTS; attempt += 1) {
    const [balanceError, balance] = await tryAsync(
      publicClient.getBalance({ address }),
    );

    if (balanceError !== undefined) {
      return { type: "error", error: balanceError.message };
    }

    lastBalance = balance;

    if (shouldOfferNativeWithdrawal(balance)) {
      return {
        type: "ready",
        balance,
        amount: getNativeWithdrawAmount(balance),
      };
    }

    if (attempt < LIVE_BALANCE_READ_ATTEMPTS - 1) {
      await delay(LIVE_BALANCE_READ_DELAY_MS);
    }
  }

  return { type: "not-ready", balance: lastBalance };
}

async function switchWalletToTorusEvm(
  walletClient: WalletClient,
): Promise<ChainSetupResult> {
  const [switchError] = await tryAsync(
    walletClient.switchChain({ id: torusEvm.id }),
  );

  if (switchError === undefined) {
    return { ok: true };
  }

  return requestWalletTorusEvmConfig(walletClient, switchError.message);
}

async function requestWalletTorusEvmConfig(
  walletClient: WalletClient,
  previousError?: string,
): Promise<ChainSetupResult> {
  const [addError] = await tryAsync(walletClient.addChain({ chain: torusEvm }));
  const [switchError] = await tryAsync(
    walletClient.switchChain({ id: torusEvm.id }),
  );

  if (switchError === undefined) {
    return { ok: true };
  }

  const details = [previousError, addError?.message, switchError.message]
    .filter((message) => message !== undefined && message.length > 0)
    .join(" ");

  return { ok: false, error: chainSetupMessage(details) };
}

async function readWalletProviderBalance(
  walletClient: WalletClient,
  address: Address,
): Promise<WalletProviderBalance> {
  const walletBalanceClient = walletClient as unknown as WalletBalanceClient;
  const [balanceError, balanceHex] = await tryAsync(
    walletBalanceClient.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  );

  if (balanceError !== undefined) {
    return { type: "error", error: balanceError.message };
  }

  return { type: "ready", balance: hexToBigInt(balanceHex) };
}

async function waitForWalletProviderBalance({
  walletClient,
  address,
  minimumBalance,
}: {
  walletClient: WalletClient;
  address: Address;
  minimumBalance: bigint;
}): Promise<WalletProviderBalance> {
  let lastBalance = 0n;

  for (let attempt = 0; attempt < WALLET_BALANCE_READ_ATTEMPTS; attempt += 1) {
    const balance = await readWalletProviderBalance(walletClient, address);

    if (balance.type === "error") {
      return balance;
    }

    lastBalance = balance.balance;

    if (balance.balance >= minimumBalance) {
      return balance;
    }

    if (attempt < WALLET_BALANCE_READ_ATTEMPTS - 1) {
      await delay(WALLET_BALANCE_READ_DELAY_MS);
    }
  }

  return { type: "ready", balance: lastBalance };
}

export function useWithdraw(): {
  state: WithdrawState;
  submit: (ss58: string, checkedAddress: Address) => Promise<void>;
  reset: () => void;
} {
  const { data: walletClient } = useWalletClient({ chainId: torusEvm.id });
  const publicClient = usePublicClient({ chainId: torusEvm.id });
  const [submissionState, setSubmissionState] = useState<WithdrawState>({
    status: "idle",
  });
  const pendingSubmission =
    submissionState.status === "pending" ? submissionState : undefined;

  const { data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    chainId: torusEvm.id,
    hash: pendingSubmission?.txHash,
    confirmations: 2,
    query: { enabled: pendingSubmission !== undefined },
  });

  const state: WithdrawState =
    pendingSubmission !== undefined && receiptError !== null
      ? { status: "error", error: receiptError.message }
      : pendingSubmission !== undefined && receipt?.status === "success"
        ? {
            status: "success",
            txHash: pendingSubmission.txHash,
            amount: pendingSubmission.amount,
          }
        : pendingSubmission !== undefined && receipt?.status === "reverted"
          ? { status: "error", error: "Withdrawal transaction reverted" }
          : submissionState;

  const submit = async (ss58: string, checkedAddress: Address) => {
    if (walletClient === undefined) {
      setSubmissionState({ status: "error", error: "Wallet not connected" });
      return;
    }

    if (publicClient === undefined) {
      setSubmissionState({
        status: "error",
        error: "TorusEVM RPC unavailable. Check your connection and try again.",
      });
      return;
    }

    const walletAddress = walletClient.account.address;

    if (!isAddressEqual(walletAddress, checkedAddress)) {
      setSubmissionState({
        status: "error",
        error: `Wallet account changed from ${shortAddress(checkedAddress)} to ${shortAddress(walletAddress)}. Reconnect the account that received the claim and try again.`,
      });
      return;
    }

    setSubmissionState({ status: "checking" });

    const chainSetup = await switchWalletToTorusEvm(walletClient);

    if (!chainSetup.ok) {
      setSubmissionState({ status: "error", error: chainSetup.error });
      return;
    }

    const liveWithdrawAmount = await readLiveWithdrawAmount(
      publicClient,
      walletAddress,
    );

    if (liveWithdrawAmount.type === "error") {
      setSubmissionState({
        status: "error",
        error: liveWithdrawAmount.error,
      });
      return;
    }

    if (liveWithdrawAmount.type === "not-ready") {
      setSubmissionState({
        status: "error",
        error: notReadyMessage(liveWithdrawAmount.balance),
      });
      return;
    }

    let walletProviderBalance = await waitForWalletProviderBalance({
      walletClient,
      address: walletAddress,
      minimumBalance: liveWithdrawAmount.amount,
    });

    if (
      walletProviderBalance.type === "ready" &&
      walletProviderBalance.balance < liveWithdrawAmount.amount
    ) {
      const configRefresh = await requestWalletTorusEvmConfig(walletClient);

      if (configRefresh.ok) {
        walletProviderBalance = await waitForWalletProviderBalance({
          walletClient,
          address: walletAddress,
          minimumBalance: liveWithdrawAmount.amount,
        });
      }
    }

    if (walletProviderBalance.type === "error") {
      setSubmissionState({
        status: "error",
        error: walletProviderBalance.error,
      });
      return;
    }

    if (walletProviderBalance.balance < liveWithdrawAmount.amount) {
      setSubmissionState({
        status: "error",
        error: walletNetworkMismatchMessage({
          torusBalance: liveWithdrawAmount.balance,
          walletBalance: walletProviderBalance.balance,
        }),
      });
      return;
    }

    setSubmissionState({
      status: "signing",
      amount: liveWithdrawAmount.amount,
    });

    const [error, txHash] = await tryAsync(
      withdrawFromTorusEvm(
        walletClient,
        torusEvm,
        ss58 as SS58Address,
        liveWithdrawAmount.amount,
        async () => undefined,
      ),
    );

    if (error !== undefined) {
      setSubmissionState({ status: "error", error: error.message });
      return;
    }

    setSubmissionState({
      status: "pending",
      txHash,
      amount: liveWithdrawAmount.amount,
    });
  };

  const reset = () => setSubmissionState({ status: "idle" });

  return { state, submit, reset };
}
