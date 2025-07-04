"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { fetchAgentMetadata } from "@torus-network/sdk";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";

import { api } from "~/trpc/react";

import type {
  CachedAgentData,
  ComputedWeightsList,
} from "../../permission-graph-types";
import { getAllocatorBaseUrl } from "../../permission-graph-utils";
import { AgentCard } from "./agent-card";

interface AgentCardContainerProps {
  nodeId: string;
  fullAddress?: string;
  allComputedWeights?: ComputedWeightsList;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export const AgentCardContainer = memo(
  function PermissionNodeAgentCard({
    nodeId,
    fullAddress,
    allComputedWeights,
    getCachedAgentData,
    setCachedAgentData,
  }: AgentCardContainerProps) {
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [socials, setSocials] = useState<Record<string, string>>({});
    const initialAgentName = useMemo(
      () => (fullAddress ? smallAddress(fullAddress, 6) : ""),
      [fullAddress],
    );
    const [agentName, setAgentName] = useState<string>(initialAgentName);
    const [currentBlock, setCurrentBlock] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [weightFactor, setWeightFactor] = useState<number>(0);

    const computedWeight = useMemo(() => {
      if (!allComputedWeights) return null;
      return allComputedWeights.find((weight) => weight.agentKey === nodeId);
    }, [allComputedWeights, nodeId]);

    const agentQuery = api.agent.byKeyLastBlock.useQuery(
      { key: nodeId },
      { enabled: !!nodeId },
    );

    const handleGoToAllocator = useCallback(() => {
      if (agentQuery.data) {
        const href = `${getAllocatorBaseUrl()}${agentQuery.data.key}`;
        window.open(href, "_blank");
      }
    }, [agentQuery.data]);

    const fetchMetadata = useCallback(async (metadataUri: string) => {
      const [metadataError, metadata] = await tryAsync(
        fetchAgentMetadata(metadataUri, { fetchImages: true }),
      );

      if (metadataError) {
        console.error("Error fetching agent metadata:", metadataError);
        return null;
      }

      return metadata;
    }, []);

    // Main effect to handle cached vs fresh data
    useEffect(() => {
      if (!nodeId) {
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cachedData = getCachedAgentData?.(nodeId);
      if (cachedData) {
        // Use cached data immediately
        setAgentName(cachedData.agentName);
        setSocials(cachedData.socials);
        setCurrentBlock(cachedData.currentBlock);
        setWeightFactor(cachedData.weightFactor);
        setError(null);

        // Create fresh blob URL from cached blob
        if (cachedData.iconBlob) {
          const url = URL.createObjectURL(cachedData.iconBlob);
          setIconUrl(url);
        } else {
          setIconUrl(null);
        }

        setIsLoading(false);
        return;
      }

      // No cached data, need to fetch
      setIsLoading(true);
      setError(null);
    }, [nodeId, getCachedAgentData]);

    // Handle fresh data fetching when not cached
    useEffect(() => {
      const cachedData = getCachedAgentData?.(nodeId);
      if (
        cachedData ||
        !nodeId ||
        agentQuery.isLoading ||
        !agentQuery.data
        // !computedWeightedAgents
      ) {
        return;
      }

      if (agentQuery.error) {
        console.error("Error fetching agent data:", agentQuery.error);
        setError(new Error("Failed to fetch agent data"));
        setIsLoading(false);
        return;
      }

      const agent = agentQuery.data;
      const agentName = agent.name ?? smallAddress(nodeId, 6);
      const currentBlock = agent.atBlock;
      const weightFactor = computedWeight?.percComputedWeight ?? 0;

      setAgentName(agentName);
      setWeightFactor(weightFactor);
      setCurrentBlock(currentBlock);
      setError(null);

      if (agent.metadataUri === null) {
        // No metadata, cache basic data and finish
        const cacheData: CachedAgentData = {
          agentName,
          iconBlob: null,
          socials: {},
          currentBlock,
          weightFactor,
          lastAccessed: Date.now(),
        };
        setCachedAgentData?.(nodeId, cacheData);
        setIsLoading(false);
        return;
      }

      const metadataUri = agent.metadataUri;

      // Fetch metadata
      const loadMetadata = async () => {
        const metadata = await fetchMetadata(metadataUri);
        let iconBlob: Blob | null = null;
        const socials: Record<string, string> = {};

        if (metadata) {
          if (metadata.images.icon) {
            iconBlob = metadata.images.icon;
            const url = URL.createObjectURL(iconBlob);
            setIconUrl(url);
          }

          if (metadata.metadata.website) {
            socials.website = metadata.metadata.website;
          }

          if (metadata.metadata.socials) {
            const { socials: metaSocials } = metadata.metadata;
            if (metaSocials.discord) socials.discord = metaSocials.discord;
            if (metaSocials.twitter) socials.twitter = metaSocials.twitter;
            if (metaSocials.github) socials.github = metaSocials.github;
            if (metaSocials.telegram) socials.telegram = metaSocials.telegram;
          }

          setSocials(socials);
        }

        // Cache the complete data with blob instead of URL
        const cacheData: CachedAgentData = {
          agentName,
          iconBlob,
          socials,
          currentBlock,
          weightFactor,
          lastAccessed: Date.now(),
        };
        setCachedAgentData?.(nodeId, cacheData);
        setIsLoading(false);
      };

      void loadMetadata();
    }, [
      nodeId,
      agentQuery.data,
      agentQuery.error,
      agentQuery.isLoading,
      computedWeight,
      fetchMetadata,
      getCachedAgentData,
      setCachedAgentData,
    ]);

    // Cleanup icon URL on unmount and when iconUrl changes
    useEffect(() => {
      return () => {
        if (iconUrl) {
          URL.revokeObjectURL(iconUrl);
        }
      };
    }, [iconUrl]);

    // Cleanup previous URL when setting new one
    const setPreviousIconUrl = iconUrl;
    useEffect(() => {
      if (setPreviousIconUrl && setPreviousIconUrl !== iconUrl) {
        URL.revokeObjectURL(setPreviousIconUrl);
      }
    }, [iconUrl, setPreviousIconUrl]);

    if (error) {
      return (
        <Card className="flex-1 flex flex-col z-50 border-none">
          <p className="text-red-500">Error: {error.message}</p>
        </Card>
      );
    }

    return (
      <Card className="flex-1 flex flex-col gap-4 z-50 border-none w-full mt-4">
        {isLoading ? (
          <p>Loading agent details...</p>
        ) : (
          <AgentCard
            agentKey={fullAddress ?? nodeId}
            iconUrl={iconUrl ?? ""}
            socialsList={socials}
            title={agentName}
            currentBlock={currentBlock}
            agentWeight={weightFactor}
          />
        )}
        <Button variant="outline" onClick={handleGoToAllocator}>
          View Agent in Allocator.
        </Button>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if nodeId or fullAddress changes
    return (
      prevProps.nodeId === nextProps.nodeId &&
      prevProps.fullAddress === nextProps.fullAddress &&
      prevProps.getCachedAgentData === nextProps.getCachedAgentData &&
      prevProps.setCachedAgentData === nextProps.setCachedAgentData
    );
  },
);
