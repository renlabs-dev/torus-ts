import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import type { inferProcedureOutput } from "@trpc/server";
import { BadgeCheck } from "lucide-react";

type TwitterUser = NonNullable<
  inferProcedureOutput<AppRouter["twitterUser"]["getByUsername"]>
>;

type PredictionData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>;

interface ProfileHeaderProps {
  user: TwitterUser;
  predictions: PredictionData;
}

export default function ProfileHeader({
  user,
  predictions,
}: ProfileHeaderProps) {
  // Calculate accuracy based on verdicts
  const verdictedPredictions = predictions.filter(
    (p) => p.verdictConclusion && p.verdictConclusion.length > 0,
  );

  const truePredictions = verdictedPredictions.filter((p) => {
    const feedback = p.verdictConclusion?.[0]?.feedback.toLowerCase() ?? "";
    return feedback.includes("true") || feedback.includes("correct");
  }).length;

  const accuracy =
    verdictedPredictions.length > 0
      ? Math.round((truePredictions / verdictedPredictions.length) * 100)
      : null;

  return (
    <Card className="bg-background/80 backdrop-blur-lg">
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
            {accuracy !== null ? (
              <Badge variant="default">{accuracy}% Accuracy</Badge>
            ) : (
              <Badge variant="secondary">No verdicts yet</Badge>
            )}
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
            </div>
          </div>
          {/* TODO: Add filters */}
          <Button variant="default">Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
}
