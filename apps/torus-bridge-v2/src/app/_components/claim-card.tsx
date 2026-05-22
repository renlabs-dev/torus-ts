"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { useClaimState } from "~/hooks/use-claim-state";
import { useIsScw } from "~/hooks/use-is-scw";
import { useMerkleRootCheck } from "~/hooks/use-merkle-root-check";
import { useProof } from "~/hooks/use-proof";
import { useAccount } from "wagmi";
import { AlreadyClaimedNotice } from "./already-claimed-notice";
import { ClaimButton } from "./claim-button";
import { MerkleRootErrorBanner } from "./merkle-root-error-banner";
import { NotEligibleNotice } from "./not-eligible-notice";
import { ScwNotice } from "./scw-notice";

export function ClaimCard() {
  const { address, isConnected } = useAccount();

  const rootCheck = useMerkleRootCheck();
  const proofQuery = useProof(address);
  const scwQuery = useIsScw(address);

  const claimState = useClaimState({
    connected: isConnected,
    address,
    proofQuery,
    scwQuery,
  });

  return (
    <div className="w-full max-w-md">
      {rootCheck.status === "mismatch" && (
        <MerkleRootErrorBanner
          localRoot={rootCheck.localRoot}
          contractRoot={rootCheck.contractRoot}
        />
      )}
      {rootCheck.status === "error" && (
        <MerkleRootErrorBanner
          title="Claim data unavailable"
          description={rootCheck.error.message}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Migration Claim</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {claimState.type === "not-connected" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-muted-foreground text-sm">
                Connect your wallet to check eligibility.
              </p>
              <ConnectButton />
            </div>
          )}

          {claimState.type === "loading" && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {claimState.type === "scw-detected" && <ScwNotice />}

          {claimState.type === "not-eligible" && <NotEligibleNotice />}

          {claimState.type === "already-claimed" && (
            <AlreadyClaimedNotice amount={claimState.amountFormatted} />
          )}

          {claimState.type === "eligible" && (
            <ClaimButton
              proof={claimState.proof}
              amountFormatted={claimState.amountFormatted}
              disabled={rootCheck.status !== "ok"}
            />
          )}

          {claimState.type === "error" && (
            <p className="text-destructive text-sm">
              Error loading claim data: {claimState.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
