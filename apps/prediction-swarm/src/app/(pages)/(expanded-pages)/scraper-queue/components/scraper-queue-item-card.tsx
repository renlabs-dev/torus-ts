import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Card } from "@torus-ts/ui/components/card";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import Link from "next/link";
import { ScraperQueueItemCardProgressStages } from "./scraper-queue-item-card-progress-stages";

type QueueItem = inferProcedureOutput<
  AppRouter["scraperQueue"]["getQueueStatus"]
>[number];

interface ScraperQueueItemCardProps {
  item: QueueItem;
}

export function ScraperQueueItemCard({ item }: ScraperQueueItemCardProps) {
  return (
    <Card className="bg-background/80 plus-corners backdrop-blur-lg">
      <div className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2">
            <AvatarImage src={item.avatarUrl ?? undefined} />
            <AvatarFallback>
              {(item.screenName ?? item.username).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {item.userId ? (
                <Link href={`/user/${item.username}`}>
                  <h3 className="text-lg font-semibold hover:underline">
                    {item.screenName ?? `@${item.username}`}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-lg font-semibold">
                  {item.screenName ?? `@${item.username}`}
                </h3>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>@{item.username}</span>
              <span>•</span>
              <span>Added {dayjs(item.suggestedAt).format("MMM D, YYYY")}</span>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="overflow-x-auto">
          <ScraperQueueItemCardProgressStages status={item.status} />
        </div>
      </div>
    </Card>
  );
}
