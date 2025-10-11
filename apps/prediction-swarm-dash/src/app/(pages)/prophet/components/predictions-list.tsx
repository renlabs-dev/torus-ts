"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { LoadingDots } from "~/app/_components/loading-dots";
import { RelativeTime } from "~/app/_components/relative-time";
import { usePredictionsListQuery } from "~/hooks/api/use-predictions-list-query";
import type { Prediction, PredictionsListParams } from "~/lib/api-schemas";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface PredictionsListProps {
  username: string;
  searchFilters?: Omit<PredictionsListParams, "agent_address">;
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  // Determine prediction status from claims
  const hasTrueClaim = prediction.verification_claims.some(
    (claim: { outcome: string }) => claim.outcome === "MaturedTrue",
  );
  const hasFalseClaim = prediction.verification_claims.some(
    (claim: { outcome: string }) => claim.outcome === "MaturedFalse",
  );
  const hasUnmaturedClaim = prediction.verification_claims.some(
    (claim: { outcome: string }) => claim.outcome === "NotMatured",
  );

  return (
    <div className="border-border space-y-3 border-b py-6 last:border-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm" variant="outline">
            {prediction.topic || "General"}
          </Badge>
          <span>#{prediction.id}</span>
          <span>·</span>
          <span>
            <RelativeTime
              date={
                prediction.tweet?.tweet_timestamp ||
                prediction.prediction_timestamp ||
                prediction.inserted_at
              }
            />
          </span>
        </div>

        {prediction.tweet?.url && (
          <Link
            href={prediction.tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground flex items-center gap-1 text-xs hover:text-blue-300"
          >
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            View Post
          </Link>
        )}
      </div>

      <p className="text-sm leading-relaxed sm:text-base">
        {prediction.tweet?.full_text || prediction.prediction}
      </p>

      {/* Verification Status */}
      <div className="flex flex-wrap gap-2">
        {hasTrueClaim && (
          <Badge className="border-green-600/40 bg-green-600/20 text-green-400">
            Verified True
          </Badge>
        )}
        {hasFalseClaim && (
          <Badge className="border-red-600/40 bg-red-600/20 text-red-400">
            Verified False
          </Badge>
        )}
        {hasUnmaturedClaim && !hasTrueClaim && !hasFalseClaim && (
          <Badge className="border-amber-600/40 bg-amber-600/20 text-amber-400">
            Not Yet Matured
          </Badge>
        )}
      </div>
    </div>
  );
}

export function PredictionsList({
  username,
  searchFilters,
}: PredictionsListProps) {
  const { data: allPredictions, isLoading } = usePredictionsListQuery({
    ...searchFilters,
    sort_by: "twitter_username",
  });

  // Filter predictions by outcome
  const { truePredictions, falsePredictions, unmaturedPredictions } =
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    useMemo(() => {
      if (!allPredictions) {
        return {
          truePredictions: [],
          falsePredictions: [],
          unmaturedPredictions: [],
        };
      }

      // Filter by username
      const userPredictions = allPredictions.filter(
        (p) =>
          p.tweet?.author_twitter_username.toLowerCase() ===
          username.toLowerCase(),
      );

      return {
        truePredictions: userPredictions.filter((p) =>
          p.verification_claims.some(
            (c: { outcome: string }) => c.outcome === "MaturedTrue",
          ),
        ),
        falsePredictions: userPredictions.filter((p) =>
          p.verification_claims.some(
            (c: { outcome: string }) => c.outcome === "MaturedFalse",
          ),
        ),
        unmaturedPredictions: userPredictions.filter(
          (p) =>
            p.verification_claims.length === 0 ||
            p.verification_claims.every(
              (c: { outcome: string }) => c.outcome === "NotMatured",
            ),
        ),
      };
    }, [allPredictions, username]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="true" variant="underline">
      <div className="px-4 md:px-6">
        <div className="mx-auto w-full max-w-screen-xl">
          <TabsList
            className="-mb-1.5 grid w-full grid-cols-3 bg-transparent"
            variant="underline"
          >
            <TabsTrigger value="unmatured" variant="underline">
              <span className="font-medium">Ongoing predictions</span>
              <Badge className="ml-1 text-xs">
                {unmaturedPredictions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="true" variant="underline">
              <span className="font-medium">True predictions</span>
              <Badge className="ml-1 text-xs">{truePredictions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="false" variant="underline">
              <span className="font-medium">False predictions</span>
              <Badge className="ml-1 text-xs">{falsePredictions.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <Separator />

      <div className="px-4 md:px-6">
        <div className="mx-auto w-full max-w-screen-xl">
          <TabsContent value="true" className="mt-0">
            <div className="py-4">
              {truePredictions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  No true predictions found
                </div>
              ) : (
                truePredictions.map((prediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="false" className="mt-0">
            <div className="py-4">
              {falsePredictions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  No false predictions found
                </div>
              ) : (
                falsePredictions.map((prediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="unmatured" className="mt-0">
            <div className="py-4">
              {unmaturedPredictions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  No unmatured predictions found
                </div>
              ) : (
                unmaturedPredictions.map((prediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
