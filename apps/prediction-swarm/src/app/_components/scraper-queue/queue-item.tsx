import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Card } from "@torus-ts/ui/components/card";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { ProgressStages } from "./progress-stages";

type QueueItem = inferProcedureOutput<
  AppRouter["scraperQueue"]["getQueueStatus"]
>[number];

interface QueueItemProps {
  item: QueueItem;
  isUserAccount?: boolean;
}

export function QueueItem({ item, isUserAccount = false }: QueueItemProps) {
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
              <h3 className="text-lg font-semibold">
                {item.screenName ?? `@${item.username}`}
              </h3>
              {isUserAccount && (
                <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs font-medium">
                  Added by you
                </span>
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
          <ProgressStages status={item.status} />
        </div>
      </div>
    </Card>
  );
}
