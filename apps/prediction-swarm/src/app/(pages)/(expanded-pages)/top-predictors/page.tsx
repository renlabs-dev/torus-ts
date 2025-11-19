import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Card } from "@torus-ts/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { PageHeader } from "~/app/_components/page-header";
import { api } from "~/trpc/server";
import { BadgeCheck, Info } from "lucide-react";
import Link from "next/link";

export default async function TopPredictorsPage() {
  const topPredictors = await api.twitterUser.getTopPredictors({
    limit: 40,
    minPredictions: 10,
  });

  return (
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}

      <PageHeader
        title="Top Predictors"
        description="Ranked by quality score (minimum 10 verdicted predictions)"
        children={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 max-w-sm text-white">
                <div className="space-y-2">
                  <p className="font-semibold">Ranking Formula</p>
                  <div className="font-mono text-xs">
                    <p>score = (r / n) × log₁₀(n + 1)</p>
                  </div>
                  <div className="text-xs">
                    <p>r = correct predictions</p>
                    <p>w = wrong predictions</p>
                    <p>n = r + w (total verdicted)</p>
                  </div>
                  <p className="text-xs">
                    This rewards both accuracy and volume, preventing users with
                    few predictions from dominating the leaderboard.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    p.s. if you think the math isn't mathing, hit us up, it was
                    made by the front end guy.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="space-y-3">
          {topPredictors.map((predictor, index) => (
            <div key={predictor.userId} className="plus-corners">
              <Link href={`/user/${predictor.username}`} className="block">
                <Card className="bg-background/80 hover:bg-background/90 relative backdrop-blur-lg transition-colors">
                  <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                    {/* Top row: Rank, Avatar, User Info */}
                    <div className="flex items-center gap-2 md:flex-1 md:gap-4">
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
                            <span className="hidden sm:block">
                              <span>• </span>
                              <span>
                                {predictor.followerCount.toLocaleString()}{" "}
                                followers
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Separator (mobile only) */}
                    <div className="border-border border-t md:hidden" />

                    {/* Bottom row (mobile) / Right side (desktop): Stats */}
                    <div className="flex items-center justify-around gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">
                          Accuracy
                        </div>
                        <div className="text-lg font-bold">
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
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">
                          True
                        </div>
                        <div className="text-lg font-semibold">
                          {predictor.truePredictions}
                        </div>
                      </div>
                    </div>
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
      <div className="border-border relative mt-4 border-t" />
    </div>
  );
}
