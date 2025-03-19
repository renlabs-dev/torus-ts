"use client";

import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";
import { CardContent } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";

interface AgentCardContentProps {
  metadataUri: string | null;
}

export function AgentCardContent(props: Readonly<AgentCardContentProps>) {
  const { data: metadataResult, isLoading: isMetadataLoading } =
    useQueryAgentMetadata(props.metadataUri);

  if (isMetadataLoading) {
    return <SkeletonAgentCardContent />;
  }

  return (
    <CardContent>
      <Separator className="mb-4" />
      <p className="text-sm md:min-h-14">
        {metadataResult?.metadata.short_description}
      </p>
    </CardContent>
  );
}
