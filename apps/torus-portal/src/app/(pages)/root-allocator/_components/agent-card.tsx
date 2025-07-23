"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  AgentCard as UIAgentCard,
} from "@torus-ts/ui/components/agent-card/agent-card";

import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
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
      currentPercentage={props.isWhitelisted ? currentPercentage : undefined}
      onPercentageChange={
        props.isWhitelisted ? handlePercentageChange : undefined
      }
      isAccountConnected={!!selectedAccount?.address}
      isLoading={!isInitialized || isWeeklyUsdLoading}
      isMetadataLoading={isMetadataLoading}
    />
  );
}
