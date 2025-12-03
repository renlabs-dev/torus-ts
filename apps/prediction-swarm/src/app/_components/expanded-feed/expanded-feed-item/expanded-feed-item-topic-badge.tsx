"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { api } from "~/trpc/react";
import { Hash } from "lucide-react";
import { useMemo } from "react";

interface TopicBadgeProps {
  topicId: string;
}

export function ExpandedFeedItemTopicBadge({ topicId }: TopicBadgeProps) {
  const { data: topics } = api.topic.getAll.useQuery(undefined, {
    staleTime: Infinity, // Cache forever - topics rarely change
  });

  const topicName = useMemo(() => {
    if (!topics) return null;
    const topic = topics.find((t) => t.id === topicId);
    return topic?.name ?? null;
  }, [topics, topicId]);

  if (!topicName) return null;

  return (
    <Badge variant="outline" className="rounded-full text-xs">
      <Hash className="mr-1 h-3 w-3" />
      {topicName}
    </Badge>
  );
}
