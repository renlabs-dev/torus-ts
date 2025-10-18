"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Separator } from "@torus-ts/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { LoadingDots } from "~/app/_components/loading-dots";
import { RelativeTime } from "~/app/_components/relative-time";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { usePredictionsListQuery } from "~/hooks/api/use-predictions-list-query";
import type { Prediction, PredictionsListParams } from "~/lib/api-schemas";
import { CircleSlash2, ExternalLink, Gavel } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface PredictionsListProps {
  username: string;
  searchFilters?: Omit<PredictionsListParams, "agent_address">;
}

// Format outcome text and determine badge color
function getOutcomeConfig(outcome: string) {
  switch (outcome) {
    case "MaturedTrue":
      return {
        text: "Matured True",
        className: "bg-green-600/20 text-green-400 border-green-600/40",
      };
    case "MaturedFalse":
      return {
        text: "Matured False",
        className: "bg-red-600/20 text-red-400 border-red-600/40",
      };
    case "MaturedMostlyTrue":
      return {
        text: "Mostly True",
        className: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
      };
    case "NotMatured":
      return {
        text: "Not Matured",
        className: "bg-amber-600/20 text-amber-400 border-amber-600/40",
      };
    case "Invalid":
      return {
        text: "Invalid",
        className: "bg-gray-600/20 text-gray-400 border-gray-600/40",
      };
    case "MissingContext":
      return {
        text: "Missing Context",
        className: "bg-orange-600/20 text-orange-400 border-orange-600/40",
      };
    default:
      return {
        text: outcome,
        className: "bg-muted/20 text-muted-foreground border-muted",
      };
  }
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div className="border-border space-y-4 border-b py-6 last:border-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm" variant="outline">
            {prediction.topic || "General"}
          </Badge>

          {/* Verdict Indicator */}
          {prediction.verification_verdict &&
          typeof prediction.verification_verdict === "object" &&
          "reasoning" in prediction.verification_verdict &&
          prediction.verification_verdict.reasoning ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer gap-1 border-purple-600 text-xs text-purple-600 hover:bg-purple-600/20 hover:text-purple-600 sm:text-sm"
                >
                  <Gavel className="h-2.5 w-2.5" />
                  <span className="text-xs">View Verdict</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Verification Verdict</h4>
                  <p className="text-muted-foreground text-sm">
                    {typeof prediction.verification_verdict.reasoning ===
                    "string"
                      ? prediction.verification_verdict.reasoning
                      : ""}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="text-muted-foreground flex items-center gap-1">
              <CircleSlash2 className="h-3 w-3" />
              <span className="text-xs">No Verdict</span>
            </div>
          )}

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

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* External Link */}
          {prediction.tweet?.url && (
            <Link
              href={prediction.tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground flex items-center gap-1 text-xs hover:text-blue-300"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              Post
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-relaxed sm:text-base">
          {prediction.tweet?.full_text || prediction.prediction}
        </p>

        {/* Claims Section */}
        {prediction.verification_claims.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="claims" className="border-none">
              <AccordionTrigger className="bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded px-3 py-2 text-sm font-medium hover:no-underline">
                <span className="text-muted-foreground">
                  Verification Claims ({prediction.verification_claims.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {prediction.verification_claims.map(
                    (
                      claim: {
                        id: number;
                        outcome: string;
                        proof: string;
                        inserted_by_address: string;
                      },
                      index: number,
                    ) => (
                      <ClaimDisplay key={claim.id || index} claim={claim} />
                    ),
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}

function ClaimDisplay({
  claim,
}: {
  claim: {
    id: number;
    outcome: string;
    proof: string;
    inserted_by_address: string;
  };
}) {
  const { agentName } = useAgentName(claim.inserted_by_address || "");
  const outcomeConfig = getOutcomeConfig(claim.outcome);

  return (
    <div className="border-border rounded border p-2">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge
          className={`text-xs ${outcomeConfig.className}`}
          variant="outline"
        >
          {outcomeConfig.text}
        </Badge>
        <span className="text-muted-foreground text-xs">
          by {agentName || claim.inserted_by_address.slice(0, 8) + "..."},
        </span>
        <span className="text-muted-foreground text-xs">Claim #{claim.id}</span>
      </div>
      <div className="text-muted-foreground break-all text-xs leading-relaxed">
        {claim.proof}
      </div>
    </div>
  );
}

export function PredictionsList({
  username,
  searchFilters,
}: PredictionsListProps) {
  // Use search parameter to filter by username since there's no dedicated filter
  const { data: allPredictions, isLoading } = usePredictionsListQuery({
    ...searchFilters,
    search: username,
    sort_by: "twitter_username",
  });

  // Filter predictions by outcome
  const { truePredictions, falsePredictions, unmaturedPredictions } =
    useMemo(() => {
      if (!allPredictions) {
        return {
          truePredictions: [],
          falsePredictions: [],
          unmaturedPredictions: [],
        };
      }

      // Further filter by exact username match
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
    <Tabs defaultValue="unmatured" variant="underline">
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
