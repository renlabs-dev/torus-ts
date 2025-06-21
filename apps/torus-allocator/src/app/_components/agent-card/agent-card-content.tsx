"use client";

import { CardContent } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import type { AgentMetadataResult } from "@torus-network/sdk";
import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";

interface AgentCardContentProps {
  metadataUri: string;
  shortDescription?: AgentMetadataResult["metadata"]["short_description"];
}

export function AgentCardContent({
  metadataUri,
  shortDescription,
}: Readonly<AgentCardContentProps>) {
  const { data: agentMetadata, isLoading: isAgentMetadataLoading } =
    useQueryAgentMetadata(metadataUri, {
      enabled: Boolean(metadataUri) && !shortDescription,
    });

  if (isAgentMetadataLoading && !shortDescription) {
    return <SkeletonAgentCardContent />;
  }

  const displayDescription =
    shortDescription ?? agentMetadata?.metadata.short_description;

  return (
    <CardContent>
      <Separator className="mb-4" />
      <p className="text-sm md:min-h-14 break-words">{displayDescription}</p>
    </CardContent>
  );
}
