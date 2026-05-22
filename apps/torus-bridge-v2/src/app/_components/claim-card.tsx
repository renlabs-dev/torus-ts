"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@torus-ts/ui/components/hover-card";
import { Icons } from "@torus-ts/ui/components/icons";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useClaimState } from "~/hooks/use-claim-state";
import { useIsScw } from "~/hooks/use-is-scw";
import { useMerkleRootCheck } from "~/hooks/use-merkle-root-check";
import { useProof } from "~/hooks/use-proof";
import { Info } from "lucide-react";
import { useAccount } from "wagmi";
import { AddressChecker } from "./address-checker";
import { AlreadyClaimedNotice } from "./already-claimed-notice";
import { ClaimButton } from "./claim-button";
import { MerkleRootErrorBanner } from "./merkle-root-error-banner";
import { NotEligibleNotice } from "./not-eligible-notice";
import { ScwFootnote } from "./scw-footnote";
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icons.Logo className="h-4 w-auto" />
            Migration Claim
          </CardTitle>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="How claiming works"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="h-4 w-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              align="start"
              className="w-72 text-xs"
            >
              <p className="mb-2 text-sm font-medium">How claiming works</p>
              <ol className="text-muted-foreground flex list-none flex-col gap-1.5">
                <li className="flex gap-2">
                  <span className="text-foreground shrink-0 font-medium">
                    1.
                  </span>
                  Connect your EVM wallet (MetaMask, SubWallet, etc.).
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground shrink-0 font-medium">
                    2.
                  </span>
                  Your address is checked against a migration snapshot of Base
                  TORUS holders.
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground shrink-0 font-medium">
                    3.
                  </span>
                  If eligible, a Merkle proof verifies your allocation on-chain.
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground shrink-0 font-medium">
                    4.
                  </span>
                  Confirm the transaction — TORUS is sent to your connected
                  address on TorusEVM.
                </li>
              </ol>
              <p className="text-muted-foreground mt-2">
                This is a one-time claim. Each address can only claim once.
              </p>
            </HoverCardContent>
          </HoverCard>
        </CardHeader>

        <Tabs defaultValue="claim">
          <TabsList
            variant="underline"
            className="border-border w-full justify-start rounded-none border-b bg-transparent px-6 pb-0"
          >
            <TabsTrigger variant="underline" value="claim">
              Claim
            </TabsTrigger>
            <TabsTrigger variant="underline" value="check">
              Check eligibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="px-6 pb-6 pt-4">
            <AddressChecker />
          </TabsContent>

          <TabsContent value="claim">
            <CardContent className="flex flex-col gap-4 pt-4">
              {claimState.type === "not-connected" && (
                <div className="text-muted-foreground py-2 text-sm">
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <p>
                        <button
                          type="button"
                          onClick={openConnectModal}
                          className="text-foreground hover:text-foreground/70 underline underline-offset-2 transition-colors"
                        >
                          Connect your wallet
                        </button>{" "}
                        to check eligibility and claim.
                      </p>
                    )}
                  </ConnectButton.Custom>
                </div>
              )}

              {claimState.type === "loading" && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
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
          </TabsContent>
        </Tabs>
      </Card>

      <ScwFootnote />
    </div>
  );
}
