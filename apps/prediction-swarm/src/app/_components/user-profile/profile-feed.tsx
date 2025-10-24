import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import type { inferProcedureOutput } from "@trpc/server";
import { BadgeCheck, Calendar, Target, TrendingUp } from "lucide-react";

type PredictionData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>[number];

interface ProfileFeedProps {
  predictions: PredictionData[];
  variant?: "user" | "feed";
}

/**
 * Formats date into relative time or date string
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats time in HH:MM AM/PM format
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Extracts text from goal PostSlice array
 */
function extractGoalText(goal: PredictionData["goal"]): string {
  return goal.map((slice) => slice.source.tweet_id).join(" ");
}

/**
 * Extracts text from timeframe PostSlice array
 */
function extractTimeframeText(timeframe: PredictionData["timeframe"]): string {
  return timeframe.map((slice) => slice.source.tweet_id).join(" ");
}

/**
 * Gets confidence color based on llmConfidence value
 */
function getConfidenceColor(confidence: string): string {
  const conf = parseFloat(confidence);
  if (conf >= 0.8) return "bg-green-100 text-green-800";
  if (conf >= 0.5) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
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
  // variant = "user",
}: ProfileFeedProps) {
  let currentDate = "";

  // Group predictions by date
  const groupedPredictions = predictions.reduce(
    (acc, prediction) => {
      const dateKey = formatDate(new Date(prediction.predictionCreatedAt));
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(prediction);
      return acc;
    },
    {} as Record<string, PredictionData[]>,
  );

  return (
    <div className="mx-auto p-4 md:p-4">
      {predictions.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <p>No predictions found</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {Object.entries(groupedPredictions).map(([date, datePredictions]) => {
            const showDate = currentDate !== date;
            if (showDate) {
              currentDate = date;
            }

            return (
              <div key={date}>
                {/* Date Header */}
                {showDate && (
                  <div className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide md:mb-4 md:text-sm">
                    {date}
                  </div>
                )}

                {/* Predictions for this date */}
                {datePredictions.map((prediction) => (
                  <div key={prediction.parsedId} className="mb-4 md:mb-6">
                    {/* Prediction Item */}
                    <div className="relative flex gap-2 md:gap-3">
                      {/* Avatar */}

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-2 md:text-sm">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <div className="relative z-10">
                              <Avatar className="h-6 w-6 md:h-8 md:w-8">
                                <AvatarImage
                                  src={prediction.avatarUrl ?? undefined}
                                  alt={
                                    prediction.screenName ??
                                    prediction.username ??
                                    "User"
                                  }
                                />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                                  {(
                                    prediction.screenName ??
                                    prediction.username ??
                                    "U"
                                  )
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <>
                              <span className="text-foreground font-medium">
                                {prediction.screenName}
                              </span>
                              {prediction.isVerified && (
                                <BadgeCheck className="text-primary size-4" />
                              )}
                            </>

                            <span className="text-muted-foreground">
                              @{prediction.username}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`${getConfidenceColor(prediction.llmConfidence)} text-xs`}
                            >
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {getConfidenceLabel(prediction.llmConfidence)} LLM
                              Confidence
                            </Badge>
                          </div>
                          <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                            {formatTime(
                              new Date(prediction.predictionCreatedAt),
                            )}
                          </span>
                        </div>

                        {/* Prediction Content */}
                        <div className="bg-muted/60 mt-2 space-y-3 rounded-lg p-3 md:mt-3 md:p-4">
                          {/* Original Tweet */}
                          <div className="text-foreground text-sm leading-relaxed md:text-base">
                            {prediction.tweetText}
                          </div>

                          {/* Prediction Details */}
                          <div className="space-y-2">
                            {/* Goal */}
                            <div className="flex items-start gap-2">
                              <Target className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                              <div className="flex-1">
                                <div className="text-muted-foreground text-xs font-medium">
                                  PREDICTION
                                </div>
                                <div className="text-foreground text-sm">
                                  {extractGoalText(prediction.goal)}
                                </div>
                              </div>
                            </div>

                            {/* Timeframe */}
                            <div className="flex items-start gap-2">
                              <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                              <div className="flex-1">
                                <div className="text-muted-foreground text-xs font-medium">
                                  TIMEFRAME
                                </div>
                                <div className="text-foreground text-sm">
                                  {extractTimeframeText(prediction.timeframe)}
                                </div>
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="border-muted-foreground/20 flex flex-wrap gap-2 border-t pt-2">
                              {prediction.vagueness && (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground text-xs"
                                >
                                  Vagueness:{" "}
                                  {(
                                    parseFloat(prediction.vagueness) * 100
                                  ).toFixed(0)}
                                  %
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
