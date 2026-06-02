"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Input } from "@torus-ts/ui/components/input";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { env } from "~/env";
import { useProof } from "~/hooks/use-proof";
import { torusMigrationClaimAbi } from "~/lib/contract";
import {
  buildRelayClaimRequest,
  formatClaimTypedDataForDisplay,
  parseClaimSignature,
  submitRelayClaimRequest,
} from "~/lib/relay-claim";
import { AlertCircle, CheckCircle, Clipboard, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { useReadContract } from "wagmi";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted"; txHash: `0x${string}` }
  | { status: "error"; error: string };

interface ManualSignatureClaimProps {
  disabled: boolean;
}

export function ManualSignatureClaim({
  disabled,
}: Readonly<ManualSignatureClaimProps>) {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const [eligibleInput, setEligibleInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [signatureInput, setSignatureInput] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const eligibleAddress = parseEvmAddress(eligibleInput);
  const recipientAddress = parseEvmAddress(recipientInput);
  const proofQuery = useProof(eligibleAddress);
  const proof = proofQuery.data ?? undefined;
  const signature = parseClaimSignature(signatureInput);

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "isClaimed",
    args: proof !== undefined ? [BigInt(proof.index)] : undefined,
    query: { enabled: proof !== undefined },
  });

  const typedData = useMemo(() => {
    if (proof === undefined || recipientAddress === undefined) {
      return undefined;
    }

    return formatClaimTypedDataForDisplay({
      proof,
      recipient: recipientAddress,
      contractAddress,
    });
  }, [contractAddress, proof, recipientAddress]);

  const eligibleError =
    (submitAttempted || eligibleInput.trim().length > 0) &&
    eligibleAddress === undefined
      ? "Enter the eligible 0x address."
      : undefined;
  const recipientError =
    (submitAttempted || recipientInput.trim().length > 0) &&
    recipientAddress === undefined
      ? "Enter the EVM address that should receive the claim."
      : undefined;
  const signatureError =
    (submitAttempted || signatureInput.trim().length > 0) &&
    signature === undefined
      ? "Paste the 65-byte EIP-712 signature returned by the signer."
      : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (
      disabled ||
      proof === undefined ||
      recipientAddress === undefined ||
      signature === undefined ||
      isClaimed !== false
    ) {
      return;
    }

    setState({ status: "submitting" });
    const result = await submitRelayClaimRequest(
      buildRelayClaimRequest({
        proof,
        recipient: recipientAddress,
        signature,
      }),
    );

    if (!result.ok) {
      setState({ status: "error", error: result.error });
      return;
    }

    setState({ status: "submitted", txHash: result.txHash });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Use this if you do not want to connect the eligible wallet to this app.
        Sign the typed data elsewhere with the eligible address, then paste only
        the returned signature here.
      </p>

      <div className="flex flex-col gap-2">
        <LabeledInput
          label="Eligible EVM address"
          value={eligibleInput}
          onChange={(value) => {
            setEligibleInput(value);
            setState({ status: "idle" });
          }}
          error={eligibleError}
        />

        <LabeledInput
          label="Recipient EVM address"
          value={recipientInput}
          onChange={(value) => {
            setRecipientInput(value);
            setState({ status: "idle" });
          }}
          error={recipientError}
        />
      </div>

      <ProofStatus
        proofAmount={proof?.amount}
        proofIsPending={proofQuery.isPending}
        proofIsError={proofQuery.isError}
        proofIsNull={proofQuery.data === null}
        eligibleAddress={eligibleAddress}
        isClaimed={isClaimed}
        isClaimedLoading={isClaimedLoading}
      />

      {typedData !== undefined && proof !== undefined && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium">EIP-712 typed data</p>
            <CopyButton
              type="button"
              variant="outline"
              copy={typedData}
              message="Typed data copied."
              className="h-7 shrink-0 px-2"
            >
              <Clipboard className="h-3.5 w-3.5" />
              Copy
            </CopyButton>
          </div>

          <Textarea
            readOnly
            value={typedData}
            className="h-44 resize-none font-mono text-[11px] leading-relaxed"
            aria-label="EIP-712 typed data to sign"
          />

          <ul className="text-muted-foreground flex list-none flex-col gap-1 text-xs">
            <li>1. Sign this exact typed data with the eligible address.</li>
            <li>
              2. The recipient is where the TorusEVM claim will be deposited.
            </li>
            <li>
              3. Chain ID must be 21000 and the contract must be{" "}
              <span className="font-mono">{contractAddress}</span>.
            </li>
            <li>4. Never paste a private key anywhere.</li>
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Signature
          <Textarea
            value={signatureInput}
            onChange={(event) => {
              setSignatureInput(event.target.value);
              setState({ status: "idle" });
            }}
            placeholder="0x..."
            className="h-20 resize-none font-mono text-xs"
            aria-label="Claim signature"
          />
        </label>
        {signatureError !== undefined && (
          <p className="text-destructive text-xs">{signatureError}</p>
        )}
      </div>

      {state.status === "error" && (
        <div className="text-destructive flex items-start gap-2 text-xs">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state.status === "submitted" && (
        <div className="flex items-start gap-2 text-xs">
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
          <span>
            Relayed claim submitted. Connect the recipient wallet in the Claim
            tab to withdraw to Torus mainnet.
            <span className="text-muted-foreground mt-1 block truncate font-mono">
              tx: {state.txHash}
            </span>
          </span>
        </div>
      )}

      {disabled && (
        <p className="text-muted-foreground text-xs">
          Claim data is still being verified.
        </p>
      )}

      <Button
        type="submit"
        disabled={
          disabled ||
          state.status === "submitting" ||
          proof === undefined ||
          recipientAddress === undefined ||
          signature === undefined ||
          isClaimed !== false
        }
        className="w-full"
      >
        {state.status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting to relayer
          </>
        ) : (
          "Submit signed claim"
        )}
      </Button>
    </form>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  error,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
}>) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      {label}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0x..."
        className="font-mono text-xs"
      />
      {error !== undefined && <span className="text-destructive">{error}</span>}
    </label>
  );
}

interface ProofStatusProps {
  proofAmount: string | undefined;
  proofIsPending: boolean;
  proofIsError: boolean;
  proofIsNull: boolean;
  eligibleAddress: `0x${string}` | undefined;
  isClaimed: boolean | undefined;
  isClaimedLoading: boolean;
}

function ProofStatus({
  proofAmount,
  proofIsPending,
  proofIsError,
  proofIsNull,
  eligibleAddress,
  isClaimed,
  isClaimedLoading,
}: Readonly<ProofStatusProps>) {
  if (eligibleAddress === undefined) {
    return (
      <p className="text-muted-foreground text-xs">
        Enter an eligible 0x address to prepare the signature payload.
      </p>
    );
  }

  if (proofIsPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (proofIsError) {
    return (
      <p className="text-destructive text-xs">
        Failed to load proof data. Try again.
      </p>
    );
  }

  if (proofIsNull) {
    return (
      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>This address is not in the migration snapshot.</span>
      </div>
    );
  }

  if (proofAmount === undefined || isClaimedLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking on-chain status</span>
      </div>
    );
  }

  if (isClaimed === true) {
    return (
      <div className="text-muted-foreground flex items-start gap-2 text-xs">
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/60" />
        <span>This allocation has already been claimed.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs">
      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
      <span>
        Eligible allocation:{" "}
        <Badge variant="outline" className="h-4 px-1 py-0 text-xs">
          {proofAmount} TORUS
        </Badge>
      </span>
    </div>
  );
}

function parseEvmAddress(value: string): `0x${string}` | undefined {
  const trimmed = value.trim();
  return isAddress(trimmed) ? trimmed : undefined;
}
