"use client";

import { Button } from "@torus-ts/ui/components/button";
import { useClaimTx } from "~/hooks/use-claim-tx";
import { useRelayClaim } from "~/hooks/use-relay-claim";
import type { ProofData } from "~/lib/claim-proof-bundle";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

interface ClaimStepOneProps {
  proof: ProofData;
  amountFormatted: string;
  disabled: boolean;
}

export function ClaimStepOne({
  proof,
  amountFormatted,
  disabled,
}: Readonly<ClaimStepOneProps>) {
  const { address } = useAccount();
  const relay = useRelayClaim(proof);
  const direct = useClaimTx(proof);
  const [showDirect, setShowDirect] = useState(false);

  if (relay.state.status === "submitted") {
    return (
      <div className="flex flex-col gap-2 py-2 text-sm">
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Claim submitted — confirming on-chain…</span>
        </div>
        <p className="text-muted-foreground truncate font-mono text-xs">
          tx: {relay.state.txHash}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Default: relayed claim */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your allocation</span>
          <span className="font-medium">{amountFormatted} TORUS</span>
        </div>

        {relay.state.status === "error" && (
          <div className="text-destructive flex items-start gap-2 text-xs">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{relay.state.error}</span>
          </div>
        )}

        <Button
          onClick={() => {
            if (address !== undefined) {
              void relay.sign(address);
            }
          }}
          disabled={
            disabled ||
            relay.state.status === "signing" ||
            relay.state.status === "submitting" ||
            address === undefined
          }
          className="w-full"
        >
          {relay.state.status === "signing" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sign in wallet (no gas required)
            </>
          )}
          {relay.state.status === "submitting" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          )}
          {(relay.state.status === "idle" ||
            relay.state.status === "error") && (
            <>Sign to claim (relayer pays gas)</>
          )}
        </Button>

        {relay.state.status === "error" && (
          <button
            type="button"
            onClick={relay.reset}
            className="text-muted-foreground self-start text-xs underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>

      {/* Advanced fallback */}
      <div>
        <button
          type="button"
          onClick={() => setShowDirect((v) => !v)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showDirect ? "rotate-180" : ""}`}
          />
          Have TorusEVM gas? Claim directly
        </button>

        {showDirect && (
          <div className="border-border mt-2 flex flex-col gap-2 border-l pl-4">
            {direct.state.status === "error" && (
              <div className="text-destructive flex items-start gap-2 text-xs">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {direct.state.error.kind === "underfunded"
                    ? "Contract not yet funded. Try again later."
                    : direct.state.error.kind === "invalid-proof"
                      ? "Proof verification failed. Contact support."
                      : direct.state.error.kind === "already-claimed"
                        ? "This allocation has already been claimed."
                        : direct.state.error.message}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={direct.submit}
              disabled={
                disabled ||
                direct.state.status === "signing" ||
                direct.state.status === "pending" ||
                direct.state.status === "success"
              }
              className="w-full"
            >
              {direct.state.status === "signing" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirm in wallet
                </>
              )}
              {direct.state.status === "pending" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transaction pending
                </>
              )}
              {direct.state.status === "success" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming…
                </>
              )}
              {(direct.state.status === "idle" ||
                direct.state.status === "error") &&
                "Claim directly (uses your gas)"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
