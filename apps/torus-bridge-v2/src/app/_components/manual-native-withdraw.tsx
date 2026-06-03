"use client";

import { decodeAddress } from "@polkadot/util-crypto";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Input } from "@torus-ts/ui/components/input";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { TORUS_EVM_RPC_URL, torusEvm } from "~/lib/chain";
import {
  formatUnsignedNativeWithdrawTransaction,
  parseSignedRawTransaction,
  prepareNativeWithdrawTransaction,
  validateSignedNativeWithdrawTransaction,
} from "~/lib/native-withdraw";
import type { NativeWithdrawQuote } from "~/lib/native-withdraw";
import {
  AlertCircle,
  CheckCircle,
  Clipboard,
  Loader2,
  RadioTower,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { formatEther, isAddress } from "viem";
import type { Address } from "viem";
import { usePublicClient, useWaitForTransactionReceipt } from "wagmi";

type PrepareState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "prepared"; quote: NativeWithdrawQuote }
  | { status: "error"; error: string };

type BroadcastState =
  | { status: "idle" }
  | { status: "broadcasting" }
  | { status: "pending"; txHash: `0x${string}` }
  | { status: "error"; error: string };

export function ManualNativeWithdraw() {
  const publicClient = usePublicClient({ chainId: torusEvm.id });
  const [evmAddressInput, setEvmAddressInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [signedRawInput, setSignedRawInput] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [prepareState, setPrepareState] = useState<PrepareState>({
    status: "idle",
  });
  const [broadcastState, setBroadcastState] = useState<BroadcastState>({
    status: "idle",
  });

  const evmAddress = parseEvmAddress(evmAddressInput);
  const destination = parseTorusMainnetAddress(destinationInput);
  const signedRawTransaction = parseSignedRawTransaction(signedRawInput);
  const quote =
    prepareState.status === "prepared" ? prepareState.quote : undefined;
  const pendingHash =
    broadcastState.status === "pending" ? broadcastState.txHash : undefined;

  const { data: receipt, error: receiptError } = useWaitForTransactionReceipt({
    chainId: torusEvm.id,
    hash: pendingHash,
    confirmations: 2,
    query: { enabled: pendingHash !== undefined },
  });

  const resolvedBroadcastState =
    broadcastState.status === "pending" && receiptError !== null
      ? ({ status: "error", error: receiptError.message } as const)
      : broadcastState.status === "pending" && receipt?.status === "success"
        ? ({ status: "success", txHash: broadcastState.txHash } as const)
        : broadcastState.status === "pending" && receipt?.status === "reverted"
          ? ({
              status: "error",
              error: "Withdrawal transaction reverted",
            } as const)
          : broadcastState;

  const evmAddressError =
    (submitAttempted || evmAddressInput.trim().length > 0) &&
    evmAddress === undefined
      ? "Enter the EVM address that received the claim."
      : undefined;
  const destinationError =
    (submitAttempted || destinationInput.trim().length > 0) &&
    destination === undefined
      ? "Enter a valid Torus mainnet key address."
      : undefined;
  const signedRawError =
    signedRawInput.trim().length > 0 && signedRawTransaction === undefined
      ? "Paste the signed raw Ethereum transaction hex."
      : undefined;

  const resetPreparedTransaction = () => {
    setPrepareState({ status: "idle" });
    setBroadcastState({ status: "idle" });
    setSignedRawInput("");
  };

  const handlePrepare = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (
      publicClient === undefined ||
      evmAddress === undefined ||
      destination === undefined
    ) {
      return;
    }

    setPrepareState({ status: "preparing" });
    setBroadcastState({ status: "idle" });

    const result = await prepareNativeWithdrawTransaction({
      publicClient,
      from: evmAddress,
      destination,
    });

    if (!result.ok) {
      setPrepareState({ status: "error", error: result.error });
      return;
    }

    setPrepareState({ status: "prepared", quote: result.quote });
  };

  const handleBroadcast = async (event: FormEvent) => {
    event.preventDefault();

    if (
      publicClient === undefined ||
      quote === undefined ||
      signedRawTransaction === undefined
    ) {
      return;
    }

    setBroadcastState({ status: "broadcasting" });

    const validation = await validateSignedNativeWithdrawTransaction({
      signedTransaction: signedRawTransaction,
      expected: quote.transaction,
    });

    if (!validation.ok) {
      setBroadcastState({ status: "error", error: validation.error });
      return;
    }

    const [sendError, txHash] = await tryAsync(
      publicClient.sendRawTransaction({
        serializedTransaction: signedRawTransaction,
      }),
    );

    if (sendError !== undefined) {
      setBroadcastState({ status: "error", error: sendError.message });
      return;
    }

    setBroadcastState({ status: "pending", txHash });
  };

  return (
    <div className="flex flex-col gap-5 border-t border-white/10 pt-5">
      <OfflineTutorial />

      <form onSubmit={handlePrepare} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">2. Prepare offline withdraw</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Use the EVM address that received the manual claim. This app reads
            only public RPC data and prepares a transaction for that address.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <LabeledInput
            label="Recipient EVM address"
            value={evmAddressInput}
            placeholder="0x..."
            onChange={(value) => {
              setEvmAddressInput(value);
              resetPreparedTransaction();
            }}
            error={evmAddressError}
          />
          <LabeledInput
            label="Torus mainnet key address"
            value={destinationInput}
            placeholder="Torus mainnet key address"
            onChange={(value) => {
              setDestinationInput(value);
              resetPreparedTransaction();
            }}
            error={destinationError}
          />
        </div>

        {prepareState.status === "error" && (
          <StatusMessage message={prepareState.error} />
        )}

        <Button
          type="submit"
          disabled={
            publicClient === undefined ||
            prepareState.status === "preparing" ||
            evmAddress === undefined ||
            destination === undefined
          }
          className="w-full"
        >
          {prepareState.status === "preparing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing transaction
            </>
          ) : (
            "Prepare unsigned withdraw transaction"
          )}
        </Button>
      </form>

      {quote !== undefined && (
        <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
          <WithdrawQuoteSummary quote={quote} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium">Unsigned transaction</p>
              <CopyButton
                type="button"
                variant="outline"
                copy={formatUnsignedNativeWithdrawTransaction(
                  quote.transaction,
                )}
                message="Unsigned transaction copied."
                className="h-7 shrink-0 px-2"
              >
                <Clipboard className="h-3.5 w-3.5" />
                Copy
              </CopyButton>
            </div>

            <Textarea
              readOnly
              value={formatUnsignedNativeWithdrawTransaction(quote.transaction)}
              className="h-44 resize-none font-mono text-[11px] leading-relaxed"
              aria-label="Unsigned TorusEVM withdrawal transaction"
            />

            <ul className="text-muted-foreground flex list-none flex-col gap-1 text-xs">
              <li>
                1. Sign this exact transaction outside this page with the
                recipient EVM key.
              </li>
              <li>
                2. If your signer asks for a network, use chain ID{" "}
                <span className="font-mono">{torusEvm.id}</span>, RPC{" "}
                <span className="font-mono">{TORUS_EVM_RPC_URL}</span>, symbol
                TORUS.
              </li>
              <li>
                3. If your signer calls <span className="font-mono">gas</span>{" "}
                the gas limit, use the same value.
              </li>
              <li>4. Never paste a private key into this app.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs">
              Signed raw transaction
              <Textarea
                value={signedRawInput}
                onChange={(event) => {
                  setSignedRawInput(event.target.value);
                  setBroadcastState({ status: "idle" });
                }}
                placeholder="0x..."
                className="h-24 resize-none font-mono text-xs"
                aria-label="Signed raw withdrawal transaction"
              />
            </label>
            {signedRawError !== undefined && (
              <p className="text-destructive text-xs">{signedRawError}</p>
            )}
          </div>

          <BroadcastStatus state={resolvedBroadcastState} />

          <Button
            type="submit"
            disabled={
              publicClient === undefined ||
              signedRawTransaction === undefined ||
              resolvedBroadcastState.status === "broadcasting" ||
              resolvedBroadcastState.status === "pending" ||
              resolvedBroadcastState.status === "success"
            }
            className="w-full"
          >
            {resolvedBroadcastState.status === "broadcasting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying transaction
              </>
            ) : resolvedBroadcastState.status === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming withdrawal
              </>
            ) : (
              "Verify and broadcast signed withdraw"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

function OfflineTutorial() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Offline migration flow</p>
      <ol className="text-muted-foreground flex list-none flex-col gap-1.5 text-xs leading-relaxed">
        <li>
          <span className="text-foreground font-medium">1.</span> Use the manual
          claim above to send the allocation to an EVM address you control. The
          relayer submits that claim; your wallet never connects to this page.
        </li>
        <li>
          <span className="text-foreground font-medium">2.</span> Wait until
          that EVM address has TORUS on TorusEVM.
        </li>
        <li>
          <span className="text-foreground font-medium">3.</span> Prepare the
          withdraw transaction below for your Torus mainnet key address.
        </li>
        <li>
          <span className="text-foreground font-medium">4.</span> Sign the raw
          EVM transaction elsewhere, paste only the signed transaction here, and
          this app verifies then broadcasts it.
        </li>
      </ol>
    </div>
  );
}

function WithdrawQuoteSummary({
  quote,
}: Readonly<{ quote: NativeWithdrawQuote }>) {
  return (
    <div className="border-border flex flex-col gap-2 rounded border bg-white/[0.02] p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Withdraw amount</span>
        <Badge variant="outline" className="h-auto px-1.5 py-0.5 text-xs">
          {formatEther(quote.amount)} TORUS
        </Badge>
      </div>
      <SummaryRow label="TorusEVM balance" value={formatEther(quote.balance)} />
      <SummaryRow
        label="Max gas reserved"
        value={formatEther(quote.maxGasCost)}
      />
      <SummaryRow
        label="Precompile"
        value={quote.transaction.to}
        monospace
        truncate
      />
      <SummaryRow label="Nonce" value={quote.transaction.nonce.toString()} />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  monospace = false,
  truncate = false,
}: Readonly<{
  label: string;
  value: string;
  monospace?: boolean;
  truncate?: boolean;
}>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`${monospace ? "font-mono" : ""} ${
          truncate ? "max-w-[220px] truncate" : ""
        } text-right`}
      >
        {value}
      </span>
    </div>
  );
}

function BroadcastStatus({
  state,
}: Readonly<{
  state:
    | BroadcastState
    | { status: "success"; txHash: `0x${string}` }
    | { status: "error"; error: string };
}>) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    return <StatusMessage message={state.error} />;
  }

  if (state.status === "success") {
    return (
      <div className="flex items-start gap-2 text-xs">
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
        <span>
          Withdrawal confirmed.
          <span className="text-muted-foreground mt-1 block truncate font-mono">
            tx: {state.txHash}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      {state.status === "broadcasting" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RadioTower className="h-3.5 w-3.5" />
      )}
      <span>
        {state.status === "broadcasting"
          ? "Checking signed transaction"
          : "Withdrawal broadcast. Waiting for confirmation."}
      </span>
    </div>
  );
}

function StatusMessage({ message }: Readonly<{ message: string }>) {
  return (
    <div className="text-destructive flex min-w-0 items-start gap-2 text-xs">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="break-words">{message}</span>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  placeholder,
  onChange,
  error,
}: Readonly<{
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error: string | undefined;
}>) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      {label}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="font-mono text-xs"
      />
      {error !== undefined && <span className="text-destructive">{error}</span>}
    </label>
  );
}

function parseEvmAddress(value: string): Address | undefined {
  const trimmed = value.trim();
  return isAddress(trimmed) ? trimmed : undefined;
}

function parseTorusMainnetAddress(value: string): SS58Address | undefined {
  const trimmed = value.trim();
  const [error] = trySync(() => decodeAddress(trimmed));
  return error === undefined ? (trimmed as SS58Address) : undefined;
}
