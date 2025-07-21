"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { fetchAgentMetadata } from "@torus-network/sdk/metadata";
import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import {
  AgentCard as UIAgentCard,
} from "@torus-ts/ui/components/agent-card/agent-card";
import {
  AgentItemSkeleton,
} from "@torus-ts/ui/components/agent-card/agent-card-skeleton-loader";
import { Card } from "@torus-ts/ui/components/card";

import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";
import { api } from "~/trpc/react";

import type {
  CachedAgentData,
  ComputedWeightsList,
} from "../permission-graph-types";

interface AgentCardContainerProps {
  nodeId: string;
  fullAddress?: string;
  allComputedWeights?: ComputedWeightsList;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export const AgentCard = memo(
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
    const [shortDescription, setShortDescription] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [weightFactor, setWeightFactor] = useState<number>(0);

    const { displayTokensPerWeek, isLoading: isWeeklyUsdLoading } =
      useWeeklyUsdCalculation({
        agentKey: fullAddress ?? nodeId,
        weightFactor: 0, // No weight penalty in portal
      });

    const computedWeight = useMemo(() => {
      if (!allComputedWeights) return null;
      return allComputedWeights.find((weight) => weight.agentKey === nodeId);
    }, [allComputedWeights, nodeId]);

    const agentQuery = api.agent.byKeyLastBlock.useQuery({ key: nodeId });

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
        setShortDescription(cachedData.shortDescription);
        setSocials(cachedData.socials);
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
      const weightFactor = computedWeight?.percComputedWeight ?? 0;

      setAgentName(agentName);
      setWeightFactor(weightFactor);
      setError(null);

      if (agent.metadataUri === null) {
        // No metadata, cache basic data and finish
        const cacheData: CachedAgentData = {
          agentName,
          shortDescription: "",
          iconBlob: null,
          socials: {},
          currentBlock: 0,
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
        let shortDesc = "";

        if (metadata) {
          if (metadata.images.icon) {
            iconBlob = metadata.images.icon;
            const url = URL.createObjectURL(iconBlob);
            setIconUrl(url);
          }

          if (metadata.metadata.short_description) {
            shortDesc = metadata.metadata.short_description;
            setShortDescription(shortDesc);
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
          shortDescription: shortDesc,
          iconBlob,
          socials,
          currentBlock: 0,
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

    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col z-50 w-full">
          <AgentItemSkeleton />
        </div>
      );
    }

    return (
      <UIAgentCard
        name={agentName}
        agentKey={fullAddress ?? nodeId}
        iconUrl={iconUrl}
        shortDescription={shortDescription}
        socials={socials}
        website={socials.website}
        percComputedWeight={weightFactor}
        showHoverEffect={false}
        tokensPerWeek={displayTokensPerWeek}
        isLoading={isWeeklyUsdLoading}
      />
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
