"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { AgentCard as UIAgentCard } from "@torus-ts/ui/components/agent-card/agent-card";

import { env } from "~/env";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { useUserWeightPower } from "~/hooks/use-user-weight-power";
import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
  isWhitelisted: boolean;
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

  const { displayTokensPerWeek, isLoading: isWeeklyUsdLoading } =
    useWeeklyUsdCalculation({
      agentKey: props.agentKey,
      weightFactor: props.weightFactor,
    });

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

  return (
    <UIAgentCard
      id={props.id}
      name={props.name}
      agentKey={props.agentKey}
      iconUrl={iconUrl}
      shortDescription={shortDescription}
      socials={socials}
      website={website}
      percComputedWeight={props.percComputedWeight}
      href={`/root-allocator/agent/${props.agentKey}`}
      showHoverEffect={true}
      isAgentDelegated={isAgentDelegated}
      isAgentSelected={isAgentSelected}
      tokensPerWeek={displayTokensPerWeek}
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
      isMetadataLoading={isMetadataLoading}
      userWeightPower={userWeightPower}
    />
  );
}
