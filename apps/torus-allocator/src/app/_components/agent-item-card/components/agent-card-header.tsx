"use client";

import { SkeletonAgentCardHeader } from "./agent-card-skeleton-loader";
import { buildSocials, SocialsInfo } from "./socials-info";
import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
import { CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@torus-ts/ui/components/hover-card";
import { Icons } from "@torus-ts/ui/components/icons";
import { Label } from "@torus-ts/ui/components/label";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { cn } from "@torus-ts/ui/lib/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Cuboid, Globe, IdCard } from "lucide-react";
import Image from "next/image";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

interface AgentCardHeaderProps {
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  networkAllocation: number | null;
}

export function AgentCardHeader(props: Readonly<AgentCardHeaderProps>) {
  const { isInitialized } = useTorus();
  const { originalAgents, delegatedAgents } = useDelegateAgentStore();

  const { data: metadataResult, isLoading: isMetadataLoading } =
    useQueryAgentMetadata(props.metadataUri);

  const metadata = metadataResult?.metadata;
  const socialsList = buildSocials(metadata?.socials ?? {}, metadata?.website);
  const title = metadata?.title ?? props.name;

  const icon = metadataResult?.images.icon;
  const iconUrl = useBlobUrl(icon);

  // TODO: those 2 are inverted keeeeek
  const isAgentDelegated = delegatedAgents.some(
    (a) => a.address === props.agentKey,
  );

  const isAgentSelected = originalAgents.some(
    (a) => a.address === props.agentKey,
  );

  if (isMetadataLoading) {
    return <SkeletonAgentCardHeader />;
  }

  return (
    <CardHeader>
      <div
        className={`flex w-full flex-col items-center gap-6 md:flex-row md:gap-3`}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt="agent"
            width={1000}
            height={1000}
            className={`aspect-square rounded-sm shadow-xl md:h-32 md:w-32`}
          />
        ) : (
          <div className="flex aspect-square h-full w-full items-center justify-center rounded-sm border bg-gray-500/10 shadow-xl md:h-32 md:w-32">
            <Icons.Logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
          </div>
        )}

        <div className="mt-1 flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <SocialsInfo socials={socialsList} />
            {isInitialized ? (
              <Badge
                className={cn(
                  isAgentSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
                    : "border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10",
                  isAgentDelegated ? "visible" : "invisible",
                )}
              >
                {!isAgentSelected ? "Selected" : "Delegated"}
              </Badge>
            ) : (
              <Skeleton className="h-6 w-24 rounded-full" />
            )}
          </div>
          <h2
            className={`w-fit text-ellipsis text-base font-semibold md:max-w-fit`}
          >
            {title}
          </h2>
          <div className="relative z-30 flex items-center justify-between">
            <HoverCard>
              <HoverCardTrigger>
                <Label
                  className={`flex items-center gap-1.5 text-xs font-semibold`}
                >
                  <Globe size={14} />
                  {props.networkAllocation !== null
                    ? `${Math.round(props.networkAllocation * 100)}%`
                    : "0%"}
                </Label>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm">
                  Current Network Allocation on this agent.
                </p>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger>
                <Label
                  className={`flex items-center gap-1.5 text-xs font-semibold`}
                >
                  <Cuboid size={16} />
                  {props.registrationBlock}
                </Label>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm">Registration Block of this agent.</p>
              </HoverCardContent>
            </HoverCard>

            <CopyButton
              variant="link"
              copy={props.agentKey}
              className={`text-foreground-muted hover:text-muted-foreground flex items-center gap-1.5 px-0 font-bold hover:no-underline`}
            >
              <IdCard size={14} />
              <span className="text-xs">{smallAddress(props.agentKey, 4)}</span>
            </CopyButton>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
