"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
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
import { TORUS_EVM_RPC_URL, torusEvm } from "~/lib/chain";
import { shouldOfferNativeWithdrawal } from "~/lib/claim-amounts";
import { Check, Info, Loader2 } from "lucide-react";
import Script from "next/script";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { AddressChecker } from "./address-checker";
import { AlreadyClaimedNotice } from "./already-claimed-notice";
import { ClaimStepOne } from "./claim-step-one";
import { ClaimStepTwo } from "./claim-step-two";
import { ManualNativeWithdraw } from "./manual-native-withdraw";
import { ManualSignatureClaim } from "./manual-signature-claim";
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
    <div className="border-border border-b bg-white/[0.015] px-5 py-4 text-xs sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            <span className="text-foreground font-medium">
              This is the Base migration claim.
            </span>{" "}
            After the Base bridge compromise, TORUS liquidity moved OTC on Torus
            mainnet. If your TORUS was already on mainnet, no action is needed.
            For further information, see the{" "}
            <a
              href={BASE_MIGRATION_UPDATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/70 underline underline-offset-2 transition-colors"
            >
              official update
            </a>
            .
          </p>

          <details>
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 transition-colors">
              Show embedded update
            </summary>
            <div className="mt-2 max-w-xl overflow-hidden rounded border border-white/10 bg-black/20 p-2">
              <blockquote
                className="twitter-tweet"
                data-cards="hidden"
                data-conversation="none"
                data-dnt="true"
                data-theme="dark"
              >
                <a href={BASE_MIGRATION_UPDATE_URL}>
                  Official Torus update on X
                </a>
              </blockquote>
            </div>
          </details>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <MigrationFact label="Affected" value="Previous Base holders" />
          <MigrationFact label="Not affected" value="Already on mainnet" />
          <MigrationFact label="Result" value="TORUS on Torus mainnet" />
        </div>
      </div>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

function MigrationFact({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="border-border rounded border bg-black/10 px-3 py-2">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-foreground mt-0.5 text-xs">{value}</p>
    </div>
  );
}

function OfflineFlowGuide() {
  return (
    <Accordion
      type="single"
      collapsible
      className="border-border rounded border bg-white/[0.015] px-4"
    >
      <AccordionItem value="offline-guide" className="border-0">
        <AccordionTrigger className="gap-4 py-3 text-left hover:no-underline">
          <span className="flex min-w-0 flex-col gap-1">
            <span>How to claim without connecting a wallet</span>
            <span className="text-muted-foreground text-xs font-normal leading-relaxed">
              Copy payloads from this page, sign them in a wallet or local CLI
              you trust, then paste back only the signature or signed
              transaction.
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="grid gap-4 text-xs leading-relaxed lg:grid-cols-3">
            <GuideSection title="Before you start">
              <p>
                Create or open a Torus mainnet wallet and copy its mainnet key
                address. This is not a Base, MetaMask, or TorusEVM address.
              </p>
              <p>
                Recommended CLI signer for EVM keys: Foundry{" "}
                <span className="font-mono">cast</span>. Hardware wallets,
                encrypted keystores, and other EIP-712/raw transaction signers
                are also fine.
              </p>
            </GuideSection>

            <GuideSection title="1. Claim to TorusEVM">
              <p>
                Enter the eligible 0x address and the recipient 0x address, then
                copy the EIP-712 typed data.
              </p>
              <CodeLine>
                cast wallet sign --data --from-file claim.json --interactive
              </CodeLine>
              <p>
                Paste the returned signature below. The relayer submits this
                claim, so the eligible wallet does not need gas here.
              </p>
            </GuideSection>

            <GuideSection title="2. Withdraw to mainnet">
              <p>
                After TORUS lands on TorusEVM, prepare the unsigned withdrawal
                transaction for your Torus mainnet key address.
              </p>
              <p>
                Sign the exact legacy transaction fields shown here on chain{" "}
                <span className="font-mono">{torusEvm.id}</span> using RPC{" "}
                <span className="font-mono">{TORUS_EVM_RPC_URL}</span>. Paste
                the raw signed transaction below; this app verifies every field
                before broadcasting.
              </p>
            </GuideSection>
          </div>
          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
            Never paste a private key into this page. Do not change the copied
            payload fields unless you are intentionally changing the recipient.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function GuideSection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground font-medium">{title}</p>
      <div className="text-muted-foreground flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function CodeLine({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <code className="border-border text-foreground block overflow-x-auto rounded border bg-black/20 px-2 py-1.5 font-mono text-[11px]">
      {children}
    </code>
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
    <div className="w-full max-w-6xl">
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

      <Card className="overflow-hidden">
        <CardHeader className="border-border flex flex-row items-center justify-between border-b px-5 py-4 sm:px-6">
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
                    Claim TORUS to TorusEVM. The relayer pays gas, so no
                    TorusEVM balance is required for this step.
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
                  amount of the just-claimed TORUS for gas. The offline tab can
                  do both steps without connecting a wallet to this page.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardHeader>

        <BaseMigrationNotice />

        <Tabs defaultValue="claim" className="gap-0">
          <TabsList
            variant="underline"
            className="border-border grid h-auto w-full grid-cols-1 justify-stretch rounded-none border-b bg-transparent px-0 pb-0 sm:grid-cols-3"
          >
            <TabsTrigger
              variant="underline"
              value="claim"
              className="h-11 rounded-none"
            >
              Claim
            </TabsTrigger>
            <TabsTrigger
              variant="underline"
              value="check"
              className="h-11 rounded-none"
            >
              Check eligibility
            </TabsTrigger>
            <TabsTrigger
              variant="underline"
              value="manual"
              className="h-11 rounded-none"
            >
              Offline flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="m-0 px-5 py-5 sm:px-6">
            <AddressChecker />
          </TabsContent>

          <TabsContent value="manual" className="m-0 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5">
              <OfflineFlowGuide />
              <div className="grid gap-5 md:grid-cols-2 md:items-start">
                <section className="border-border min-w-0 rounded border bg-white/[0.01] p-4">
                  <ManualSignatureClaim disabled={rootCheck.status !== "ok"} />
                </section>
                <section className="border-border min-w-0 rounded border bg-white/[0.01] p-4">
                  <ManualNativeWithdraw />
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="claim" className="m-0">
            <CardContent className="flex flex-col gap-4 px-5 py-5 sm:px-6">
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

              {claimState.type === "step2-available" &&
                address !== undefined && (
                  <ClaimStepTwo
                    evmAddress={address}
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
