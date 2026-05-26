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
import { shouldOfferNativeWithdrawal } from "~/lib/claim-amounts";
import { Check, Info, Loader2 } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import { useAccount } from "wagmi";
import { AddressChecker } from "./address-checker";
import { AlreadyClaimedNotice } from "./already-claimed-notice";
import { ClaimStepOne } from "./claim-step-one";
import { ClaimStepTwo } from "./claim-step-two";
import { MerkleRootErrorBanner } from "./merkle-root-error-banner";
import { NotEligibleNotice } from "./not-eligible-notice";
import { ScwFootnote } from "./scw-footnote";
import { ScwNotice } from "./scw-notice";

const BASE_MIGRATION_UPDATE_URL =
  "https://x.com/torus_network/status/2059218385594974223";

function StepIndicator({
  step1Done,
  step2Active,
}: Readonly<{ step1Done: boolean; step2Active: boolean }>) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-3 pb-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-medium ${
            step1Done
              ? "border-green-500 bg-green-500/10 text-green-500"
              : "border-foreground bg-foreground/10 text-foreground"
          }`}
        >
          {step1Done ? <Check className="h-2.5 w-2.5" /> : "1"}
        </span>
        Claim to TorusEVM
      </span>
      <span className="text-border">→</span>
      <span className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-medium ${
            step2Active
              ? "border-foreground bg-foreground/10 text-foreground"
              : "border-muted-foreground text-muted-foreground"
          }`}
        >
          2
        </span>
        <span className={step2Active ? "text-foreground" : ""}>
          Withdraw to native
        </span>
      </span>
    </div>
  );
}

function BaseMigrationNotice() {
  return (
    <div className="border-border mx-6 mb-4 rounded border bg-white/[0.02] p-3 text-xs">
      <p className="text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">
          This is the Base migration claim.
        </span>{" "}
        After the Base bridge compromise, TORUS liquidity moved OTC on Torus
        mainnet. If your TORUS was already on mainnet, no action is needed. For
        further information, see the official update.
      </p>

      <details className="mt-2">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 transition-colors">
          Official update on X
        </summary>
        <div className="mt-2 overflow-hidden rounded border border-white/10 bg-black/20 p-2">
          <blockquote
            className="twitter-tweet"
            data-cards="hidden"
            data-conversation="none"
            data-dnt="true"
            data-theme="dark"
          >
            <a href={BASE_MIGRATION_UPDATE_URL}>Official Torus update on X</a>
          </blockquote>
        </div>
      </details>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

function AwaitingNativeWithdrawalNotice() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-sm">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      <p className="font-medium">Claim confirmed</p>
      <p className="text-muted-foreground text-center">
        Waiting for the TorusEVM balance before the native withdrawal step
        appears. Keep this wallet connected.
      </p>
    </div>
  );
}

export function ClaimCard() {
  const { address, isConnected } = useAccount();
  const [claimStartedAddress, setClaimStartedAddress] = useState<
    `0x${string}` | null
  >(null);
  const [withdrawStartedAddress, setWithdrawStartedAddress] = useState<
    `0x${string}` | null
  >(null);

  const rootCheck = useMerkleRootCheck();
  const proofQuery = useProof(address);
  const scwQuery = useIsScw(address);

  const claimState = useClaimState({
    connected: isConnected,
    address,
    proofQuery,
    scwQuery,
  });

  const step1Done =
    claimState.type === "step2-available" ||
    claimState.type === "already-claimed";

  const step2Active = claimState.type === "step2-available";
  const claimStarted = address !== undefined && claimStartedAddress === address;
  const withdrawStarted =
    address !== undefined && withdrawStartedAddress === address;
  const awaitingNativeWithdrawal =
    claimState.type === "already-claimed" &&
    claimStarted &&
    !withdrawStarted &&
    shouldOfferNativeWithdrawal(claimState.amountRaw);

  const handleClaimStarted = () => {
    if (address === undefined) return;
    setClaimStartedAddress(address);
    setWithdrawStartedAddress(null);
  };

  const handleWithdrawStarted = () => {
    if (address === undefined) return;
    setWithdrawStartedAddress(address);
  };

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
            Base Migration Claim
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <ConnectButton.Custom>
                {({ account, openAccountModal }) =>
                  account ? (
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="text-muted-foreground hover:text-foreground border-border rounded border px-2 py-0.5 font-mono text-xs transition-colors"
                    >
                      {account.displayName}
                    </button>
                  ) : null
                }
              </ConnectButton.Custom>
            )}
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
                    Connect your EVM wallet. Sign an offline message — the
                    relayer pays gas, so no TorusEVM balance is required.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground shrink-0 font-medium">
                      2.
                    </span>
                    TORUS lands in your TorusEVM address. Then enter your Torus
                    native address and withdraw to Torus mainnet in one more
                    step.
                  </li>
                </ol>
                <p className="text-muted-foreground mt-2">
                  Each address can only claim once. The withdrawal uses a small
                  amount of the just-claimed TORUS for gas.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>

        <BaseMigrationNotice />

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
              {/* Step indicator — only shown when connected */}
              {(claimState.type === "eligible" ||
                claimState.type === "step2-available" ||
                claimState.type === "already-claimed") && (
                <StepIndicator
                  step1Done={step1Done}
                  step2Active={step2Active}
                />
              )}

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
                <>
                  {awaitingNativeWithdrawal ? (
                    <AwaitingNativeWithdrawalNotice />
                  ) : (
                    <AlreadyClaimedNotice amount={claimState.amountFormatted} />
                  )}
                </>
              )}

              {claimState.type === "eligible" && (
                <ClaimStepOne
                  proof={claimState.proof}
                  amountFormatted={claimState.amountFormatted}
                  disabled={rootCheck.status !== "ok"}
                  onClaimStarted={handleClaimStarted}
                />
              )}

              {claimState.type === "step2-available" && (
                <ClaimStepTwo
                  evmBalance={claimState.evmBalance}
                  onWithdrawStarted={handleWithdrawStarted}
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
