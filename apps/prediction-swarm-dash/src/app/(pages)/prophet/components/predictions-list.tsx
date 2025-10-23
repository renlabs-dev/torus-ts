"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
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
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { usePredictionsListQuery } from "~/hooks/api/use-predictions-list-query";
import type { Prediction, PredictionsListParams } from "~/lib/api-schemas";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface PredictionsListProps {
  username: string;
  searchFilters?: Omit<PredictionsListParams, "agent_address">;
  claimAgentFilter?: string;
}

// Categorize a prediction based on its claims (mutually exclusive)
export function categorizePrediction(
  prediction: Prediction,
  claimAgentFilter?: string,
): "true" | "false" | "unmatured" {
  // Filter claims by agent if filter is provided
  let claims = prediction.verification_claims;
  if (claimAgentFilter) {
    claims = claims.filter(
      (c: { inserted_by_address: string }) =>
        c.inserted_by_address === claimAgentFilter,
    );
  }

  // Only consider MaturedTrue and MaturedFalse claims
  const maturedClaims = claims.filter(
    (c: { outcome: string }) =>
      c.outcome === "MaturedTrue" || c.outcome === "MaturedFalse",
  );

  // If no matured claims, it's unmatured
  if (maturedClaims.length === 0) {
    return "unmatured";
  }

  // Check if ANY claim is MaturedTrue (takes priority)
  const hasTrueClaim = maturedClaims.some(
    (c: { outcome: string }) => c.outcome === "MaturedTrue",
  );
  if (hasTrueClaim) {
    return "true";
  }

  // Check if ANY claim is MaturedFalse
  const hasFalseClaim = maturedClaims.some(
    (c: { outcome: string }) => c.outcome === "MaturedFalse",
  );
  if (hasFalseClaim) {
    return "false";
  }

  // All other cases are unmatured
  return "unmatured";
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

function PredictionCard({
  prediction,
  claimAgentFilter,
}: {
  prediction: Prediction;
  claimAgentFilter?: string;
}) {
  // Filter claims by agent if filter is provided
  const filteredClaims = claimAgentFilter
    ? prediction.verification_claims.filter(
        (claim: { inserted_by_address: string }) =>
          claim.inserted_by_address === claimAgentFilter,
      )
    : prediction.verification_claims;

  // Only show MaturedTrue and MaturedFalse claims
  const validClaims = filteredClaims.filter(
    (claim: { outcome: string }) =>
      claim.outcome === "MaturedTrue" || claim.outcome === "MaturedFalse",
  );

  return (
    <div className="border-border space-y-4 border-b py-6 last:border-none">
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
        {validClaims.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="claims" className="border-none">
              <AccordionTrigger className="bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded px-3 py-2 text-sm font-medium hover:no-underline">
                <span className="text-muted-foreground">
                  Verification Claims ({validClaims.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {validClaims.map(
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
  claimAgentFilter,
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
      let userPredictions = allPredictions.filter(
        (p) =>
          p.tweet?.author_twitter_username.toLowerCase() ===
          username.toLowerCase(),
      );

      // Filter out predictions that don't have MaturedTrue or MaturedFalse claims
      // when agent filter is applied
      if (claimAgentFilter) {
        userPredictions = userPredictions.filter((p) => {
          const agentClaims = p.verification_claims.filter(
            (claim: { inserted_by_address: string }) =>
              claim.inserted_by_address === claimAgentFilter,
          );

          // If no claims from this agent, hide the prediction
          if (agentClaims.length === 0) {
            return false;
          }

          // Check if there's at least one MaturedTrue or MaturedFalse claim
          const hasMaturedClaim = agentClaims.some(
            (claim: { outcome: string }) =>
              claim.outcome === "MaturedTrue" ||
              claim.outcome === "MaturedFalse",
          );

          return hasMaturedClaim;
        });
      }

      return {
        truePredictions: userPredictions.filter(
          (p) => categorizePrediction(p, claimAgentFilter) === "true",
        ),
        falsePredictions: userPredictions.filter(
          (p) => categorizePrediction(p, claimAgentFilter) === "false",
        ),
        unmaturedPredictions: userPredictions.filter(
          (p) => categorizePrediction(p, claimAgentFilter) === "unmatured",
        ),
      };
    }, [allPredictions, username, claimAgentFilter]);

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
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    claimAgentFilter={claimAgentFilter}
                  />
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
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    claimAgentFilter={claimAgentFilter}
                  />
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
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    claimAgentFilter={claimAgentFilter}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
