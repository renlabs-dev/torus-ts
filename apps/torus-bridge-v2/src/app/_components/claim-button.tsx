"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { useClaimTx } from "~/hooks/use-claim-tx";
import type { ProofData } from "~/hooks/use-proof";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

interface ClaimButtonProps {
  proof: ProofData;
  amountFormatted: string;
  disabled: boolean;
}

export function ClaimButton({
  proof,
  amountFormatted,
  disabled,
}: Readonly<ClaimButtonProps>) {
  const { state, submit, reset } = useClaimTx(proof);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="text-sm font-medium">
          Successfully claimed {amountFormatted} TORUS
        </p>
        <a
          href={`https://evm.torus.network/tx/${state.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground flex items-center gap-1 text-xs underline"
        >
          View transaction <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  if (state.status === "error") {
    const { error } = state;

    let message: string;
    if (error.kind === "already-claimed") {
      message = "This allocation has already been claimed.";
    } else if (error.kind === "invalid-proof") {
      message = "Proof verification failed. Please contact support.";
    } else if (error.kind === "underfunded") {
      message =
        "The contract does not yet have sufficient funds. Please try again later.";
    } else {
      message = error.message;
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="text-destructive flex items-start gap-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    );
  }

  const isProcessing = state.status === "signing" || state.status === "pending";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Your allocation</span>
        <Badge variant="outline">{amountFormatted} TORUS</Badge>
      </div>
      <Button
        onClick={submit}
        disabled={disabled || isProcessing}
        className="w-full"
      >
        {state.status === "signing" && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirm in wallet
          </>
        )}
        {state.status === "pending" && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Transaction pending
          </>
        )}
        {state.status === "idle" && "Claim tokens"}
      </Button>
    </div>
  );
}
