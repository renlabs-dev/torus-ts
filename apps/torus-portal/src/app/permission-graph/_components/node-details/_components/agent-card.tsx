"use client";

import { fetchAgentMetadata } from "@torus-network/sdk";
import { Card } from "@torus-ts/ui/components/card";
import { PortalAgentItem } from "../../../../_components/portal-agent-item";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { api } from "~/trpc/react";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface PermissionNodeAgentCardProps {
  nodeId: string;
  fullAddress?: string;
}

export const PermissionNodeAgentCard = memo(function PermissionNodeAgentCard({ 
  nodeId,
  fullAddress
}: PermissionNodeAgentCardProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const initialAgentName = useMemo(() => 
    fullAddress ? smallAddress(fullAddress, 6) : "", 
    [fullAddress]
  );
  const [agentName, setAgentName] = useState<string>(initialAgentName);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [weightFactor, setWeightFactor] = useState<number>(0);


  const { data: computedWeightedAgents } = api.computedAgentWeight.byAgentKey.useQuery(
    { agentKey: nodeId },
    { enabled: !!nodeId }
  );

  const agentQuery = api.agent.byKeyLastBlock.useQuery(
    { key: nodeId },
    { enabled: !!nodeId }
  );

  const fetchMetadata = useCallback(async (metadataUri: string) => {
    const [metadataError, metadata] = await tryAsync(
      fetchAgentMetadata(metadataUri, { fetchImages: true })
    );

    if (metadataError) {
      console.error("Error fetching agent metadata:", metadataError);
      return null;
    }

    return metadata;
  }, []);


  // Handle basic agent data
  useEffect(() => {
    if (!nodeId || agentQuery.isLoading || !agentQuery.data || !computedWeightedAgents) {
      return;
    }

    if (agentQuery.error) {
      console.error("Error fetching agent data:", agentQuery.error);
      setError(new Error("Failed to fetch agent data"));
      setIsLoading(false);
      return;
    }

    const agent = agentQuery.data;
    setAgentName(agent.name ?? smallAddress(nodeId, 6));
    setWeightFactor(computedWeightedAgents.percComputedWeight);
    setCurrentBlock(agent.atBlock);
    setError(null);

    if (!agent.metadataUri) {
      setIsLoading(false);
      return;
    }

    // Fetch metadata separately
    const loadMetadata = async () => {
      const metadata = await fetchMetadata(agent.metadataUri!);
      if (!metadata) {
        setIsLoading(false);
        return;
      }

      if (metadata.images.icon) {
        setIconUrl(URL.createObjectURL(metadata.images.icon));
      }

      const socialLinks: Record<string, string> = {};
      if (metadata.metadata.website) {
        socialLinks.website = metadata.metadata.website;
      }

      if (metadata.metadata.socials) {
        const { socials: metaSocials } = metadata.metadata;
        if (metaSocials.discord) socialLinks.discord = metaSocials.discord;
        if (metaSocials.twitter) socialLinks.twitter = metaSocials.twitter;
        if (metaSocials.github) socialLinks.github = metaSocials.github;
        if (metaSocials.telegram) socialLinks.telegram = metaSocials.telegram;
      }

      setSocials(socialLinks);
      setIsLoading(false);
    };

    void loadMetadata();
  }, [nodeId, agentQuery.data, agentQuery.error, agentQuery.isLoading, computedWeightedAgents, fetchMetadata]);

  // Handle loading state separately
  useEffect(() => {
    if (!nodeId) {
      setIsLoading(false);
      return;
    }
    if (!computedWeightedAgents) {
      setIsLoading(false);
      setWeightFactor(0);
      return;
    }
    if (!agentQuery.isLoading && agentQuery.data) {
      setIsLoading(true);
    }
  }, [nodeId, computedWeightedAgents, agentQuery.isLoading, agentQuery.data]);

  // Cleanup icon URL on unmount
  useEffect(() => {
    return () => {
      if (iconUrl) {
        URL.revokeObjectURL(iconUrl);
      }
    };
  }, [iconUrl]);

  if (error) {
    return (
      <Card className="w-[27em] flex-1 p-4 flex flex-col z-50">
        <h2 className="text-lg font-semibold mb-4">Agent Details</h2>
        <p className="text-red-500">Error: {error.message}</p>
      </Card>
    );
  }

  return (
    <Card className="w-[27em] flex-1 p-4 flex flex-col z-50">
      <h2 className="text-lg font-semibold mb-4">Agent Details</h2>
      {isLoading ? (
        <p>Loading agent details...</p>
      ) : (
        <PortalAgentItem
          agentKey={fullAddress ?? nodeId}
          iconUrl={iconUrl ?? ""}
          socialsList={socials}
          title={agentName}
          currentBlock={currentBlock}
          agentWeight={weightFactor}
        />
      )}
    </Card>
  );
});