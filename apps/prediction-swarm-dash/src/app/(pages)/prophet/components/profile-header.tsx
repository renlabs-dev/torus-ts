"use client";

import { cn } from "@torus-ts/ui/lib/utils";
import type { ProphetProfile } from "~/lib/api-schemas";
import Image from "next/image";

interface ProfileHeaderProps {
  profile: ProphetProfile;
  truePredictionsCount: number;
  falsePredictionsCount: number;
  unmaturedPredictionsCount: number;
  totalPredictions: number;
  onFiltersClick?: () => void;
}

export function ProfileHeader({
  profile,
  truePredictionsCount,
  falsePredictionsCount,
  // unmaturedPredictionsCount,
  // totalPredictions,
  // onFiltersClick,
}: ProfileHeaderProps) {
  // Calculate accuracy based only on resolved predictions (true + false)
  const resolvedPredictionsCount = truePredictionsCount + falsePredictionsCount;
  const accuracyPercentage =
    resolvedPredictionsCount > 0
      ? Math.round((truePredictionsCount / resolvedPredictionsCount) * 100)
      : 0;

  return (
    <div className={cn("w-full border-t p-0", "animate-fade-down")}>
      {/* Profile Content */}
      <div className="relative px-4 pb-6 md:px-6">
        <div className="mx-auto w-full max-w-screen-xl">
          {/* Avatar and basic info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              {/* Avatar */}
              <div className="relative -mt-12 sm:-mt-16">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border sm:h-36 sm:w-36">
                  {profile.profile_image_url ? (
                    <Image
                      src={profile.profile_image_url}
                      alt={profile.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center text-2xl font-bold">
                      {profile.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <div className="mt-4 flex flex-col gap-1">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {profile.display_name}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Filters Button */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={onFiltersClick}
              className="w-fit"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button> */}
          </div>

          {/* Stats Row */}
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span>
              <span className="text-foreground font-semibold">
                {profile.follower_count.toLocaleString()}
              </span>{" "}
              Followers
            </span>
            <span>·</span>
            <span>
              <span className="text-foreground font-semibold">
                {profile.scraped_tweet_count.toLocaleString()}
              </span>{" "}
              /{" "}
              <span className="text-foreground font-semibold">
                {profile.profile_tweet_count.toLocaleString()}
              </span>{" "}
              tweets
            </span>
            <span>·</span>
            <span>
              <span className="text-foreground font-semibold">
                {accuracyPercentage}%
              </span>{" "}
              True Predictions
            </span>
          </div>

          {/* Bio Box */}
          <div className="bg-card/50 border-border mt-4 rounded-lg border p-4 shadow-sm">
            <p className="text-muted-foreground text-sm leading-relaxed">
              This account is being tracked by the Torus Prediction Swarm. All
              predictions are verified and stored on-chain for transparency and
              accountability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
