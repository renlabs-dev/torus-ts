"use client";

import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import type { inferProcedureOutput } from "@trpc/server";
import { api } from "~/trpc/react";
import { BadgeCheck, Eye } from "lucide-react";
import { FilterDialog } from "../filter-dialog";
import { AccuracyBadge } from "./accuracy-badge";
import { LastScrapedBadge } from "./last-scraped-badge";
import { WatchButton } from "./watch-button";

type TwitterUser = NonNullable<
  inferProcedureOutput<AppRouter["twitterUser"]["getByUsername"]>
>;

type UserCounts = NonNullable<
  inferProcedureOutput<AppRouter["prediction"]["getCountsByUsername"]>
>;

interface ProfileHeaderProps {
  user: TwitterUser;
  counts: UserCounts;
  username: string;
}

export default function ProfileHeader({ user, counts }: ProfileHeaderProps) {
  const truePredictions = parseInt(String(counts.true));
  const total = truePredictions + parseInt(String(counts.false));

  const accuracy =
    total > 0 ? Math.round((truePredictions / total) * 100) : null;

  const userId = user.id.toString();
  const { data: watcherCount } = api.watch.getWatcherCount.useQuery({
    userId,
  });

  return (
    <Card className="bg-background/80 plus-corners">
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.screenName ?? user.username ?? "User avatar"}
              />
              <AvatarFallback className="text-2xl">
                {(user.screenName ?? user.username ?? "U")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <AccuracyBadge accuracy={accuracy} />
              <LastScrapedBadge scrapedAt={user.scrapedAt} />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">
                {user.screenName ?? user.username}
              </h1>
              {user.isVerified && (
                <BadgeCheck className="text-primary size-5" />
              )}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              {user.username && (
                <div className="flex items-center gap-1">@{user.username}</div>
              )}
              {user.followerCount !== null && (
                <div className="flex items-center gap-1">
                  <span className="font-bold">
                    {user.followerCount.toLocaleString()}
                  </span>{" "}
                  Followers
                </div>
              )}
              {user.tweetCount !== null && (
                <div className="flex items-center gap-1">
                  <span className="font-bold">
                    {user.tweetCount.toLocaleString()}
                  </span>{" "}
                  Posts
                </div>
              )}
              {watcherCount !== undefined && watcherCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="font-bold">
                    {watcherCount.toLocaleString()}
                  </span>{" "}
                  {watcherCount === 1 ? "Watcher" : "Watchers"}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WatchButton userId={userId} />
            <FilterDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
