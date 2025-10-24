import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import { Badge } from "@torus-ts/ui/components/badge";
import type { inferProcedureOutput } from "@trpc/server";
import { BadgeCheck, TrendingUp } from "lucide-react";

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
 * Highlights goal and timeframe portions in the tweet text
 */
function highlightTweetText(
  tweetText: string,
  goal: PredictionData["goal"],
  timeframe: PredictionData["timeframe"],
): React.ReactNode {
  // Collect all slices with their types
  const slices: {
    start: number;
    end: number;
    type: "goal" | "timeframe";
  }[] = [
    ...goal.map((s) => ({ start: s.start, end: s.end, type: "goal" as const })),
    ...timeframe.map((s) => ({
      start: s.start,
      end: s.end,
      type: "timeframe" as const,
    })),
  ];

  // Sort by start position
  slices.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  slices.forEach((slice, idx) => {
    // Add text before this slice
    if (slice.start > lastIndex) {
      parts.push(tweetText.substring(lastIndex, slice.start));
    }

    // Add highlighted slice
    const sliceText = tweetText.substring(slice.start, slice.end);
    if (slice.type === "goal") {
      parts.push(
        <span
          key={`goal-${idx}`}
          className="bg-primary/20 text-primary rounded px-1 font-medium"
        >
          {sliceText}
        </span>,
      );
    } else {
      parts.push(
        <span
          key={`timeframe-${idx}`}
          className="rounded bg-blue-500/20 px-1 font-medium text-blue-600"
        >
          {sliceText}
        </span>,
      );
    }

    lastIndex = slice.end;
  });

  // Add remaining text
  if (lastIndex < tweetText.length) {
    parts.push(tweetText.substring(lastIndex));
  }

  return parts;
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
                          {/* Original Tweet with Highlights */}
                          <div className="text-foreground text-sm leading-relaxed md:text-base">
                            {highlightTweetText(
                              prediction.tweetText,
                              prediction.goal,
                              prediction.timeframe,
                            )}
                          </div>

                          {/* Prediction Details */}
                          <div className="space-y-2">
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
