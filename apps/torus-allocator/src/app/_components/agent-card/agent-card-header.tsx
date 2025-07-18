"use client";

import { Award, Globe } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
import { CardHeader } from "@torus-ts/ui/components/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@torus-ts/ui/components/hover-card";
import { Label } from "@torus-ts/ui/components/label";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { cn } from "@torus-ts/ui/lib/utils";

import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

import { AgentIcon } from "../agent-icon";
import { SkeletonAgentCardHeader } from "./agent-card-skeleton-loader";
import { AgentCardSocialsInfo, buildSocials } from "./agent-card-socials-info";

export interface AgentPreviewData {
  title?: string;
  socials?: Record<string, string>;
  website?: string;
  iconUrl?: string;
}

export interface AgentHeaderProps {
  name: string;
  agentKey: string;
  metadataUri: string;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
  previewMode?: boolean;
  previewData?: AgentPreviewData;
}

function AgentBadge({
  isInitialized,
  isAgentSelected,
  isAgentDelegated,
  previewMode,
}: {
  isInitialized: boolean;
  isAgentSelected: boolean;
  isAgentDelegated: boolean;
  previewMode?: boolean;
}) {
  if (previewMode) return null;
  if (!isInitialized) return <Skeleton className="h-6 w-24 rounded-full" />;

  return (
    <Badge
      className={cn(
        isAgentSelected
          ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
          : "border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10",
        isAgentDelegated ? "visible" : "invisible",
      )}
    >
      {isAgentSelected ? "Delegated" : "Selected"}
    </Badge>
  );
}

function AgentStats({
  percComputedWeight,
  isLoading,
  displayTokensPerWeek,
  previewMode,
}: {
  percComputedWeight: number | null;
  isLoading: boolean;
  displayTokensPerWeek: string;
  previewMode?: boolean;
}) {
  if (previewMode) return null;

  return (
    <div className="relative z-30 flex items-center justify-start gap-3">
      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Globe size={14} />
            {percComputedWeight !== null
              ? `${Math.round(percComputedWeight * 100)}%`
              : "0%"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm">Current Network Allocation on this agent.</p>
        </HoverCardContent>
      </HoverCard>
      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1 text-xs font-semibold">
            <Award size={16} />
            {isLoading ? "00.00 TORUS" : displayTokensPerWeek}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm">Tokens per week.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export function AgentCardHeader({
  name,
  agentKey,
  metadataUri,
  percComputedWeight,
  weightFactor,
  previewMode = false,
  previewData,
}: AgentHeaderProps) {
  const { isInitialized } = useTorus();
  const { originalAgents, delegatedAgents } = useDelegateAgentStore();
  const { isLoading, displayTokensPerWeek } = useWeeklyUsdCalculation({
    agentKey,
    weightFactor,
  });
  const { data: metadataResult, isLoading: isMetadataLoading } =
    useQueryAgentMetadata(metadataUri);

  const iconFromMetadata = useBlobUrl(metadataResult?.images.icon);
  const iconUrl =
    previewMode && previewData?.iconUrl
      ? previewData.iconUrl
      : iconFromMetadata;

  const socialsList =
    previewMode && previewData?.socials
      ? buildSocials(previewData.socials, previewData.website)
      : buildSocials(
          metadataResult?.metadata.socials ?? {},
          metadataResult?.metadata.website,
        );

  const isAgentDelegated = delegatedAgents.some((a) => a.address === agentKey);
  const isAgentSelected = originalAgents.some((a) => a.address === agentKey);

  if (isMetadataLoading && !previewData) return <SkeletonAgentCardHeader />;

  return (
    <CardHeader>
      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
        <AgentIcon icon={iconUrl} alt={`${name} icon`} variant="compact" />
        <div className="mt-1 flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <AgentCardSocialsInfo socials={socialsList} />
            <AgentBadge
              isInitialized={isInitialized}
              isAgentSelected={isAgentSelected}
              isAgentDelegated={isAgentDelegated}
              previewMode={previewMode}
            />
          </div>
          <h2 className="w-fit text-ellipsis text-base font-semibold md:max-w-fit">
            {name}
          </h2>
          <AgentStats
            percComputedWeight={percComputedWeight}
            isLoading={isLoading}
            displayTokensPerWeek={displayTokensPerWeek}
            previewMode={previewMode}
          />
        </div>
      </div>
    </CardHeader>
  );
}
