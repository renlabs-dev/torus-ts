"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
import { CardHeader } from "@torus-ts/ui/components/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@torus-ts/ui/components/hover-card";
import { Icons } from "@torus-ts/ui/components/icons";
import { Label } from "@torus-ts/ui/components/label";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { cn } from "@torus-ts/ui/lib/utils";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { Award, Globe } from "lucide-react";
import Image from "next/image";
import { SkeletonAgentCardHeader } from "./agent-card-skeleton-loader";
import { buildSocials, SocialsInfo } from "./socials-info";

interface AgentCardHeaderProps {
  name: string;
  agentKey: string;
  metadataUri: string;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
}

function AgentIcon({ iconUrl }: { iconUrl: string | null }) {
  return iconUrl ? (
    <Image
      src={iconUrl}
      alt="agent"
      width={1000}
      height={1000}
      className="aspect-square rounded-sm shadow-xl md:h-32 md:w-32"
    />
  ) : (
    <div
      className="flex aspect-square h-full w-full items-center justify-center rounded-sm border
        bg-gray-500/10 shadow-xl md:h-32 md:w-32"
    >
      <Icons.Logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
    </div>
  );
}

function AgentBadge({
  isInitialized,
  isAgentSelected,
  isAgentDelegated,
}: {
  isInitialized: boolean;
  isAgentSelected: boolean;
  isAgentDelegated: boolean;
}) {
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
}: {
  percComputedWeight: number | null;
  isLoading: boolean;
  displayTokensPerWeek: string;
}) {
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
}: AgentCardHeaderProps) {
  const { isInitialized } = useTorus();
  const { originalAgents, delegatedAgents } = useDelegateAgentStore();
  const { isLoading, displayTokensPerWeek } = useWeeklyUsdCalculation({
    agentKey,
    weightFactor,
  });
  const { data: metadataResult, isLoading: isMetadataLoading } =
    useQueryAgentMetadata(metadataUri);

  const iconUrl = useBlobUrl(metadataResult?.images.icon);

  const socialsList = buildSocials(
    metadataResult?.metadata.socials ?? {},
    metadataResult?.metadata.website,
  );

  const title = metadataResult?.metadata.title ?? name;

  const isAgentDelegated = delegatedAgents.some((a) => a.address === agentKey);
  const isAgentSelected = originalAgents.some((a) => a.address === agentKey);

  if (isMetadataLoading) return <SkeletonAgentCardHeader />;

  return (
    <CardHeader>
      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
        <AgentIcon iconUrl={iconUrl} />
        <div className="mt-1 flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <SocialsInfo socials={socialsList} />
            <AgentBadge
              isInitialized={isInitialized}
              isAgentSelected={isAgentSelected}
              isAgentDelegated={isAgentDelegated}
            />
          </div>
          <h2 className="w-fit text-ellipsis text-base font-semibold md:max-w-fit">
            {title}
          </h2>
          <AgentStats
            percComputedWeight={percComputedWeight}
            isLoading={isLoading}
            displayTokensPerWeek={displayTokensPerWeek}
          />
        </div>
      </div>
    </CardHeader>
  );
}
