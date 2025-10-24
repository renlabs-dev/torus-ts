import type { AppRouter } from "@torus-ts/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@torus-ts/ui/components/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@torus-ts/ui/components/empty";
import type { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { BadgeCheck, ScanSearch, TrendingUp } from "lucide-react";
import Link from "next/link";

type PredictionData = inferProcedureOutput<
  AppRouter["prediction"]["getByUsername"]
>[number];

interface ProfileFeedProps {
  predictions: PredictionData[];
  variant?: "user" | "feed";
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
  // variant = "user",
}: ProfileFeedProps) {
  return (
    <div className="mx-auto px-4">
      {predictions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScanSearch />
            </EmptyMedia>
            <EmptyTitle>No predictions found</EmptyTitle>
            <EmptyDescription>
              We couldn't find any predictions for this filter / user.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          {predictions.map((prediction, idx) => (
            <div
              key={prediction.parsedId}
              className={
                idx < predictions.length - 1 ? "border-border border-b" : ""
              }
            >
              <div className="relative flex gap-2 py-4 md:gap-3 md:py-6">
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
                        <Link
                          href={`/user/${prediction.username}`}
                          className="text-foreground font-medium hover:underline"
                        >
                          {prediction.screenName}
                        </Link>
                        {prediction.isVerified && (
                          <BadgeCheck className="text-primary size-4" />
                        )}
                      </>
                      <span className="text-muted-foreground text-xs">•</span>
                      <Link
                        href={`/user/${prediction.username}`}
                        className="text-muted-foreground hover:underline"
                      >
                        @{prediction.username}
                      </Link>
                      {prediction.vagueness && (
                        <>
                          <span className="text-muted-foreground text-xs">
                            •
                          </span>
                          <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                            Vagueness:{" "}
                            {(parseFloat(prediction.vagueness) * 100).toFixed(
                              0,
                            )}
                            %
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs sm:ml-auto md:text-sm">
                      {dayjs(prediction.predictionCreatedAt).format(
                        "M/D/YY h:mm A",
                      )}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 p-1">
                    <div className="text-foreground text-sm leading-relaxed md:text-base">
                      {highlightTweetText(
                        prediction.tweetText,
                        prediction.goal,
                        prediction.timeframe,
                      )}
                    </div>

                    {prediction.verdictConclusion && (
                      <div className="bg-accent/20 rounded-lg border p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-muted-foreground text-xs font-medium uppercase">
                            Prediction Verdict
                          </span>
                          {prediction.verdictCreatedAt && (
                            <>
                              <span className="text-muted-foreground text-xs">
                                •
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {dayjs(prediction.verdictCreatedAt).format(
                                  "M/D/YY h:mm A",
                                )}
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground text-xs">
                            •
                          </span>
                          <span
                            className={`${getConfidenceColor(prediction.llmConfidence)} flex items-center text-xs`}
                          >
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {getConfidenceLabel(prediction.llmConfidence)} LLM
                            Confidence
                          </span>
                        </div>
                        <div className="space-y-1">
                          {prediction.verdictConclusion.map(
                            (conclusion, idx) => (
                              <div
                                key={idx}
                                className="text-foreground text-sm"
                              >
                                {conclusion.feedback}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
