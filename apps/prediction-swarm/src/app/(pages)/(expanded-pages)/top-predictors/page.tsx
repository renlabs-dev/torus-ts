import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/server";
import { BadgeCheck, Trophy } from "lucide-react";
import Link from "next/link";

export default async function TopPredictorsPage() {
  const topPredictors = await api.twitterUser.getTopPredictors({
    limit: 20,
    minPredictions: 2,
  });

  return (
    <div className="relative py-10">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="pb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Trophy className="text-primary h-8 w-8" />
            Top Predictors
          </h1>
          <p className="text-muted-foreground mt-2">
            Ranked by prediction accuracy (minimum 2 verdicted predictions)
          </p>
        </div>
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-6 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="space-y-3">
          {topPredictors.map((predictor, index) => (
            <div key={predictor.userId} className="plus-corners">
              <Link href={`/user/${predictor.username}`} className="block">
                <Card className="bg-background/80 hover:bg-background/90 relative backdrop-blur-lg transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    {/* Rank */}
                    <div className="flex w-12 items-center justify-center">
                      <span
                        className={`text-2xl font-bold ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                              ? "text-gray-400"
                              : index === 2
                                ? "text-orange-600"
                                : "text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2">
                      <AvatarImage
                        src={predictor.avatarUrl ?? undefined}
                        alt={
                          predictor.screenName ?? predictor.username ?? "User"
                        }
                      />
                      <AvatarFallback>
                        {(predictor.screenName ?? predictor.username ?? "U")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {predictor.screenName ?? predictor.username}
                        </span>
                        {predictor.isVerified && (
                          <BadgeCheck className="text-primary h-5 w-5" />
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <span>@{predictor.username}</span>
                        {predictor.followerCount !== null && (
                          <>
                            <span>•</span>
                            <span>
                              {predictor.followerCount.toLocaleString()}{" "}
                              followers
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">
                          Accuracy
                        </div>
                        <div className="text-2xl font-bold">
                          {predictor.accuracy}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">
                          Verdicted
                        </div>
                        <div className="text-lg font-semibold">
                          {predictor.verdictedPredictions}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">
                          Total
                        </div>
                        <div className="text-lg font-semibold">
                          {predictor.totalPredictions}
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Badge */}
                    <Badge
                      variant={
                        predictor.accuracy >= 80
                          ? "default"
                          : predictor.accuracy >= 50
                            ? "secondary"
                            : "outline"
                      }
                      className="text-lg font-bold"
                    >
                      {predictor.truePredictions}/
                      {predictor.verdictedPredictions}
                    </Badge>
                  </div>
                </Card>
              </Link>
            </div>
          ))}

          {topPredictors.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">
              <p>No predictors found with minimum predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
