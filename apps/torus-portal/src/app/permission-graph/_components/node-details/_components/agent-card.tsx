"use client";

import { fetchAgentMetadata } from "@torus-network/sdk";
import { Card } from "@torus-ts/ui/components/card";
import { PortalAgentItem } from "../../../../_components/portal-agent-item";
import { useEffect, useState } from "react";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { api } from "~/trpc/react";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface PermissionNodeAgentCardProps {
  nodeId: string;
  fullAddress?: string;
}

export function PermissionNodeAgentCard({ 
  nodeId,
  fullAddress
}: PermissionNodeAgentCardProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [agentName, setAgentName] = useState<string>(
    fullAddress ? smallAddress(fullAddress, 6) : ""
  );
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [weightFactor, setWeightFactor] = useState<number>(0);


  const { data: computedWeightedAgents } = api.computedAgentWeight.byAgentKey.useQuery(
    { agentKey: nodeId },
    { enabled: !!nodeId }
  )

  const agentQuery = api.agent.byKeyLastBlock.useQuery(
    { key: nodeId },
    { enabled: !!nodeId }
  );


  useEffect(() => {
    const fetchAgentData = async () => {
      if (!nodeId) {
        setIsLoading(false);
        return;
      }
      if (!computedWeightedAgents) {
        setIsLoading(false);
        setWeightFactor(0);
        return;
      }
      
      setIsLoading(true);
      setError(null);


      // Wait for the query to complete
      if (agentQuery.isLoading) return;
    
      
      if (agentQuery.error) {
        console.error("Error fetching agent data:", agentQuery.error);
        setError(new Error("Failed to fetch agent data"));
        setIsLoading(false);
        return;
      }

      if (!agentQuery.data) {
        setError(new Error("No agent data found"));
        setIsLoading(false);
        return;
      }


      const agent = agentQuery.data;
      setAgentName(agent.name ?? smallAddress(nodeId, 6));
      setWeightFactor(computedWeightedAgents.percComputedWeight);
      setCurrentBlock(agent.atBlock);
      
      // If there's no metadata URI, just use basic info
      if (!agent.metadataUri) {
        setIsLoading(false);
        return;
      }

      // Fetch metadata
      const [metadataError, metadata] = await tryAsync(
        fetchAgentMetadata(agent.metadataUri, { fetchImages: true })
      );

      if (metadataError) {
        console.error("Error fetching agent metadata:", metadataError);
        // Don't set error here - we still have basic agent info
        setIsLoading(false);
        return;
      }
      setAgentName(agent.name ?? "Agent not found");
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

    void fetchAgentData();
  }, [nodeId, agentQuery.data, agentQuery.error, agentQuery.isLoading, computedWeightedAgents]);

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
}