"use client";

import { CardContent } from "../card";
import { Separator } from "../separator";
import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";

interface AgentCardContentProps {
  shortDescription?: string;
  isLoading?: boolean;
}

export function AgentCardContent({
  shortDescription,
  isLoading = false,
}: Readonly<AgentCardContentProps>) {
  if (isLoading) {
    return <SkeletonAgentCardContent />;
  }

  return (
    <CardContent>
      <Separator className="mb-4" />
      <p className="line-clamp-3 break-words text-sm">{shortDescription}</p>
    </CardContent>
  );
}
