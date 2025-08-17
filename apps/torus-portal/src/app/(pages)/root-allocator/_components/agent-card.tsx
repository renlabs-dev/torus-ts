"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Card } from "@torus-ts/ui/components/card";
import { AgentCardHeader } from "@torus-ts/ui/components/agent-card/agent-card-header";
import { AgentCardFooter } from "@torus-ts/ui/components/agent-card/agent-card-footer";
import { CardHoverEffect } from "@torus-ts/ui/components/agent-card/agent-card-hover-effect";
import Link from "next/link";

import { env } from "~/env";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { useUserWeightPower } from "~/hooks/use-user-weight-power";
import { usePostPenaltyEmission } from "~/hooks/use-post-penalty-emission";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import type { AccountEmissionData } from "~/hooks/use-multiple-account-emissions";
import { EnhancedAgentCardContent } from "./enhanced-agent-card-content";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
  isWhitelisted: boolean;
  emissionData?: AccountEmissionData;
}

export function AgentCard(props: Readonly<AgentCardProps>) {
  const { selectedAccount, isInitialized } = useTorus();
  const { userWeightPower } = useUserWeightPower();
  const {
    originalAgents,
    delegatedAgents,
    addAgent,
    updateBalancedPercentage,
    getAgentPercentage,
    setPercentageChange,
    removeZeroPercentageAgents,
  } = useDelegateAgentStore();

  // Use emission data if available, otherwise fall back to individual hook
  const isWeeklyUsdLoading = props.emissionData?.isLoading ?? true;

  const { data: metadataResult, isLoading: isMetadataLoading } =
    useQueryAgentMetadata(props.metadataUri ?? "");

  const iconUrl = useBlobUrl(metadataResult?.images.icon);
  const socials = metadataResult?.metadata.socials ?? {};
  const website = metadataResult?.metadata.website;
  const shortDescription = metadataResult?.metadata.short_description;

  const isAgentDelegated = delegatedAgents.some(
    (a) => a.address === props.agentKey,
  );
  const isAgentSelected = originalAgents.some(
    (a) => a.address === props.agentKey,
  );
  const currentPercentage = getAgentPercentage(props.agentKey);

  // Calculate post-penalty emission percentage using custom hook
  const postPenaltyPercComputedWeight = usePostPenaltyEmission(
    props.percComputedWeight,
    props.weightFactor,
  );

  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");
  const isAllocatorAgent = props.agentKey === allocatorAddress;

  const handlePercentageChange = (newPercentage: number) => {
    setPercentageChange(true);

    if (!isAgentDelegated && newPercentage > 0) {
      addAgent({
        id: props.id,
        name: props.name,
        address: props.agentKey,
        metadataUri: props.metadataUri,
        registrationBlock: props.registrationBlock,
        percComputedWeight: props.percComputedWeight,
        weightFactor: props.weightFactor,
      });
    }

    updateBalancedPercentage(props.agentKey, newPercentage);
    removeZeroPercentageAgents();
  };

  const cardContent = (
    <>
      <CardHoverEffect />

      <AgentCardHeader
        name={props.name}
        agentKey={props.agentKey}
        iconUrl={iconUrl}
        socials={socials}
        website={website}
        isAgentDelegated={isAgentDelegated}
        isAgentSelected={isAgentSelected}
        isMetadataLoading={isMetadataLoading}
      />

      <EnhancedAgentCardContent
        shortDescription={shortDescription}
        agentKey={props.agentKey}
        percComputedWeight={postPenaltyPercComputedWeight}
        prePenaltyPercent={props.percComputedWeight}
        penaltyFactor={props.weightFactor}
        isLoading={isMetadataLoading}
        isStatsLoading={!isInitialized || isWeeklyUsdLoading}
        emissionData={props.emissionData}
      />

      <div className="mt-auto">
        <AgentCardFooter
          currentPercentage={
            props.isWhitelisted && !isAllocatorAgent ? currentPercentage : undefined
          }
          onPercentageChange={
            props.isWhitelisted && !isAllocatorAgent
              ? handlePercentageChange
              : undefined
          }
          isAccountConnected={!!selectedAccount?.address}
          isLoading={!isInitialized || isWeeklyUsdLoading}
          userWeightPower={userWeightPower}
        />
      </div>
    </>
  );

  const cardClassName = "group relative flex flex-col border bg-gradient-to-tr from-zinc-900 to-background transition duration-300 hover:scale-[102%] hover:border-white hover:shadow-2xl";

  return (
    <Card className={cardClassName}>
      {cardContent}
      <Link href={`/root-allocator/agent/${props.agentKey}`} className="absolute inset-0">
        <span className="sr-only">Click to view agent details</span>
      </Link>
    </Card>
  );
}
