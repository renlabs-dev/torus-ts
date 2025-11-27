"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Button } from "@torus-ts/ui/components/button";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@torus-ts/ui/components/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MoreVertical,
  ScanSearch,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { assert } from "tsafe";
import { PredictionReportDialog } from "../prediction-report-dialog";
import { FutureTimeframeBadge } from "./future-timeframe-badge";
import { ThreadContext } from "./thread-context";
import { TopicBadge } from "./topic-badge";

type GroupedTweetData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>[number];

interface ProfileFeedProps {
  predictions: GroupedTweetData[];
  variant?: "user" | "feed";
  isLoading?: boolean;
}

/**
 * Highlights target and timeframe portions in the tweet text for multiple predictions
 * Only highlights slices that belong to the specified tweet
 */
function highlightTweetText(
  tweetText: string,
  tweetId: bigint,
  activePrediction: GroupedTweetData["predictions"][0],
  allPredictions: GroupedTweetData["predictions"],
): React.ReactNode {
  const tweetIdStr = tweetId.toString();
  const { target, timeframe } = activePrediction;

  // Filter slices to only those belonging to this tweet
  const targetSlices = target.filter((s) => s.source.tweet_id === tweetIdStr);
  const timeframeSlices = timeframe.filter(
    (s) => s.source.tweet_id === tweetIdStr,
  );

  const inactivePredictions = allPredictions.filter(
    (p) => p.parsedId !== activePrediction.parsedId,
  );

  // Collect all position markers
  const markers: {
    pos: number;
    type: "start" | "end";
    style: "target" | "timeframe" | "inactive";
  }[] = [];

  // Add inactive prediction targets (gray highlights) - only for this tweet
  inactivePredictions.forEach((pred) => {
    pred.target
      .filter((s) => s.source.tweet_id === tweetIdStr)
      .forEach((s) => {
        markers.push({ pos: s.start, type: "start", style: "inactive" });
        markers.push({ pos: s.end, type: "end", style: "inactive" });
      });
  });

  // Add active prediction target (orange highlights)
  targetSlices.forEach((s) => {
    markers.push({ pos: s.start, type: "start", style: "target" });
    markers.push({ pos: s.end, type: "end", style: "target" });
  });

  // Only add timeframe markers if they have actual text content
  timeframeSlices.forEach((s) => {
    const text = tweetText.substring(s.start, s.end).trim();
    if (text.length > 0) {
      markers.push({ pos: s.start, type: "start", style: "timeframe" });
      markers.push({ pos: s.end, type: "end", style: "timeframe" });
    }
  });

  // Sort by position, then by type (ends before starts at same position)
  markers.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    if (a.type === "end" && b.type === "start") return -1;
    if (a.type === "start" && b.type === "end") return 1;
    return 0;
  });

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let inGoal = false;
  let inInactive = false;

  markers.forEach((marker, idx) => {
    // Render text up to this position
    if (marker.pos > lastIndex) {
      const text = tweetText.substring(lastIndex, marker.pos);

      if (inGoal) {
        parts.push(
          <span
            key={`text-${idx}`}
            className="bg-primary/20 text-primary px-1 font-medium"
          >
            {text}
          </span>,
        );
      } else if (inInactive) {
        parts.push(
          <span
            key={`text-inactive-${idx}`}
            className="bg-gray-500/10 text-gray-500"
          >
            {text}
          </span>,
        );
      } else {
        parts.push(text);
      }
      lastIndex = marker.pos;
    }

    // Handle marker
    if (marker.style === "inactive") {
      if (marker.type === "start") {
        inInactive = true;
      } else {
        inInactive = false;
      }
    } else if (marker.style === "timeframe") {
      if (marker.type === "start") {
        const bracket = (
          <span key={`bracket-open-${idx}`} className="font-bold text-blue-600">
            [
          </span>
        );
        if (inGoal) {
          parts.push(
            <span
              className="bg-primary/20 text-primary"
              key={`bracket-target-${idx}`}
            >
              {bracket}
            </span>,
          );
        } else {
          parts.push(bracket);
        }
      } else {
        const bracket = (
          <span
            key={`bracket-close-${idx}`}
            className="font-bold text-blue-600"
          >
            ]
          </span>
        );
        if (inGoal) {
          parts.push(
            <span
              className="bg-primary/20 text-primary"
              key={`bracket-target-close-${idx}`}
            >
              {bracket}
            </span>,
          );
        } else {
          parts.push(bracket);
        }
      }
    } else {
      // target marker
      if (marker.type === "start") {
        inGoal = true;
      } else {
        inGoal = false;
      }
    }
  });

  // Add remaining text
  if (lastIndex < tweetText.length) {
    const text = tweetText.substring(lastIndex);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (inGoal) {
      parts.push(
        <span
          key="final"
          className="bg-primary/20 text-primary px-1 font-medium"
        >
          {text}
        </span>,
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (inInactive) {
      parts.push(
        <span key="final-inactive" className="bg-gray-500/10 text-gray-500">
          {text}
        </span>,
      );
    } else {
      parts.push(text);
    }
  }

  return parts;
}

/**
 * Gets confidence color based on llmConfidence value
 */
function getConfidenceColor(confidence: string): string {
  const conf = parseFloat(confidence);
  if (conf >= 0.8) return "text-green-800";
  if (conf >= 0.5) return "text-yellow-800";
  return "text-red-800";
}

/**
 * Gets confidence label based on llmConfidence value
 */
function getConfidenceLabel(confidence: string): string {
  const conf = parseFloat(confidence);
  if (conf >= 0.8) return "High";
  if (conf >= 0.5) return "Medium";
  return "Low";
}

export function ProfileFeed({
  predictions,
  isLoading = false,
  // variant = "user",
}: ProfileFeedProps) {
  // State to track active prediction index for each tweet
  const [activePredictionIndex, setActivePredictionIndex] = useState<
    Record<string, number>
  >({});

  const handleNavigate = (tweetId: string, direction: "prev" | "next") => {
    const tweet = predictions.find((p) => p.tweetId.toString() === tweetId);
    if (!tweet) return;

    const canonicalPredictions = tweet.predictions.filter(
      (pred) => !pred.canonicalId,
    );

    const currentIndex = activePredictionIndex[tweetId] ?? 0;
    let newIndex = currentIndex;

    if (direction === "prev") {
      newIndex =
        currentIndex > 0 ? currentIndex - 1 : canonicalPredictions.length - 1;
    } else {
      newIndex =
        currentIndex < canonicalPredictions.length - 1 ? currentIndex + 1 : 0;
    }

    setActivePredictionIndex((prev) => ({ ...prev, [tweetId]: newIndex }));
  };

  return (
    <div className="mx-auto sm:px-4">
      {isLoading ? (
        <div className="space-y-4">
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="border-border border-b pb-6">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScanSearch />
            </EmptyMedia>
            <EmptyTitle>No predictions found</EmptyTitle>
            <EmptyDescription>
              We couldn't find any predictions for this list / filter :(
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          {predictions.map((tweet, idx) => {
            const tweetId = tweet.tweetId.toString();

            const canonicalPredictions = tweet.predictions.filter(
              (pred) => !pred.canonicalId,
            );

            if (canonicalPredictions.length === 0) return null;

            const activeIndex = activePredictionIndex[tweetId] ?? 0;
            const activePrediction = canonicalPredictions[activeIndex];

            if (!activePrediction) return null;

            return (
              <div
                key={tweetId}
                className={
                  idx < predictions.length - 1 ? "border-border border-b" : ""
                }
              >
                {/* Thread/Reply Context */}
                <div className="pt-4 md:pt-6">
                  <ThreadContext
                    tweet={tweet}
                    activePrediction={activePrediction}
                    allPredictions={canonicalPredictions}
                    highlightFn={highlightTweetText}
                  />
                </div>

                <div className="relative flex gap-2 pb-4 md:gap-3 md:pb-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-2 md:text-sm">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <div className="relative z-10">
                          <Avatar className="h-6 w-6 md:h-8 md:w-8">
                            <AvatarImage
                              src={tweet.avatarUrl ?? undefined}
                              alt={tweet.screenName ?? tweet.username ?? "User"}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                              {(tweet.screenName ?? tweet.username ?? "U")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <>
                          <Link
                            href={`/user/${tweet.username}`}
                            className="text-foreground font-medium hover:underline"
                          >
                            {tweet.screenName && tweet.screenName.length > 22
                              ? `${tweet.screenName.slice(0, 22)}...`
                              : tweet.screenName}
                          </Link>
                          {tweet.isVerified && (
                            <BadgeCheck className="text-primary size-4" />
                          )}
                        </>
                        <span className="text-muted-foreground text-xs">•</span>
                        <Link
                          href={`/user/${tweet.username}`}
                          className="text-muted-foreground hover:underline"
                        >
                          @{tweet.username}
                        </Link>
                        {activePrediction.topicId && (
                          <TopicBadge topicId={activePrediction.topicId} />
                        )}
                        {activePrediction.feedbackFailureCause ===
                          "FUTURE_TIMEFRAME" && (
                          <FutureTimeframeBadge
                            reason={
                              activePrediction.feedbackReason ??
                              "Timeframe is in the future"
                            }
                          />
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                        {dayjs(tweet.tweetDate).format("M/D/YY h:mm A")}
                      </span>
                      {/* Actions: Navigation, External Link, More Info */}
                      <div className="flex items-center gap-1">
                        {/* Navigation Arrows - only show if multiple predictions */}
                        {canonicalPredictions.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleNavigate(tweetId, "prev")}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-muted-foreground text-xs">
                              {activeIndex + 1}/{canonicalPredictions.length}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleNavigate(tweetId, "next")}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* External Link to Tweet */}
                        <Link
                          href={`https://twitter.com/${tweet.username}/status/${tweet.tweetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* More Info Popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="end">
                            <div className="space-y-3">
                              <h4 className="font-semibold">
                                Prediction Details
                              </h4>

                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Quality Score:
                                  </span>
                                  <p>
                                    {activePrediction.predictionQuality}/100
                                  </p>
                                </div>

                                {activePrediction.vagueness && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Vagueness
                                    </span>
                                    <p>
                                      {(
                                        parseFloat(activePrediction.vagueness) *
                                        100
                                      ).toFixed(0)}
                                      %
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <span className="text-muted-foreground">
                                    Brief Rationale:
                                  </span>
                                  <p className="text-xs leading-relaxed">
                                    {activePrediction.briefRationale}
                                  </p>
                                </div>

                                {activePrediction.duplicateCount &&
                                  activePrediction.duplicateCount > 0 && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Duplicates:
                                      </span>
                                      <p>
                                        {activePrediction.duplicateCount}{" "}
                                        duplicate
                                        {activePrediction.duplicateCount > 1
                                          ? "s"
                                          : ""}{" "}
                                        found
                                      </p>
                                    </div>
                                  )}

                                {activePrediction.target.length > 0 &&
                                  (() => {
                                    const firstTarget =
                                      activePrediction.target[0];
                                    assert(
                                      firstTarget !== undefined,
                                      "First target should exist when array length > 0",
                                    );
                                    return (
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="text-muted-foreground">
                                          Source:
                                        </span>
                                        <CopyButton
                                          className="hover:text-primary h-fit p-0 text-xs text-white/80"
                                          variant="link"
                                          copy={firstTarget.source.tweet_id}
                                          message="Source tweet ID copied to clipboard."
                                        >
                                          {firstTarget.source.tweet_id}
                                          <Copy className="ml-0.5 h-2 w-2" />
                                        </CopyButton>
                                      </div>
                                    );
                                  })()}

                                {activePrediction.filterAgentId && (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-muted-foreground">
                                      Filter Agent ID:
                                    </span>
                                    <CopyButton
                                      className="hover:text-primary h-fit p-0 text-xs text-white/80"
                                      variant="link"
                                      copy={activePrediction.filterAgentId}
                                      message="Filter agent ID copied to clipboard."
                                    >
                                      {smallAddress(
                                        activePrediction.filterAgentId,
                                      )}
                                      <Copy className="ml-0.5 h-2 w-2" />
                                    </CopyButton>
                                  </div>
                                )}

                                <div>
                                  <span className="text-muted-foreground">
                                    Prediction ID:
                                  </span>
                                  <CopyButton
                                    className="hover:text-primary h-fit p-0 text-xs text-white/80"
                                    variant="link"
                                    copy={activePrediction.predictionId}
                                    message="Prediction ID copied to clipboard."
                                  >
                                    {activePrediction.predictionId}
                                    <Copy className="ml-0.5 h-2 w-2" />
                                  </CopyButton>
                                </div>

                                {activePrediction.verdictId && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Verdict ID:
                                    </span>
                                    <CopyButton
                                      className="hover:text-primary h-fit p-0 text-xs text-white/80"
                                      variant="link"
                                      copy={activePrediction.verdictId}
                                      message="Verdict ID copied to clipboard."
                                    >
                                      {activePrediction.verdictId}
                                      <Copy className="ml-0.5 h-2 w-2" />
                                    </CopyButton>
                                  </div>
                                )}
                              </div>

                              <div className="border-border border-t pt-3">
                                <PredictionReportDialog
                                  parsedPredictionId={activePrediction.parsedId}
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 p-1">
                      <div className="text-foreground text-sm leading-relaxed md:text-base">
                        {highlightTweetText(
                          tweet.tweetText,
                          tweet.tweetId,
                          activePrediction,
                          tweet.predictions,
                        )}
                      </div>

                      {/* Display media links if tweet contains them */}
                      {(() => {
                        const mediaUrlMatch = tweet.tweetText.match(
                          /https?:\/\/(?:pbs\.twimg\.com|t\.co)\/\S+/g,
                        );
                        if (mediaUrlMatch) {
                          return (
                            <div className="flex flex-wrap gap-2">
                              {mediaUrlMatch.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {new URL(url).hostname === "pbs.twimg.com"
                                    ? "View Image"
                                    : "View Media"}
                                </a>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {activePrediction.verdictId && (
                        <div className="bg-accent/20 rounded-lg border p-3">
                          <div className="mb-2 flex items-center gap-2">
                            {activePrediction.verdict ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-muted-foreground text-xs font-medium uppercase">
                              {activePrediction.verdict ? "True" : "False"}
                            </span>
                            {activePrediction.verdictCreatedAt && (
                              <>
                                <span className="text-muted-foreground text-xs">
                                  •
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {dayjs(
                                    activePrediction.verdictCreatedAt,
                                  ).format("M/D/YY h:mm A")}
                                </span>
                              </>
                            )}
                            <span className="text-muted-foreground text-xs">
                              •
                            </span>
                            <span
                              className={`${getConfidenceColor(activePrediction.llmConfidence)} flex items-center text-xs`}
                            >
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {getConfidenceLabel(
                                activePrediction.llmConfidence,
                              )}{" "}
                              LLM Confidence
                            </span>
                          </div>
                          {activePrediction.verdictContext && (
                            <div className="text-foreground text-sm">
                              {activePrediction.verdictContext.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
