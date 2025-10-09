"use client";

import { CircleSlash2, ExternalLink, Gavel } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Pagination } from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeTime } from "@/components/ui/relative-time";
import { SearchInput } from "@/components/ui/search-input";
import { useAgentActivityByType } from "@/hooks/api/use-agent-detailed-metrics-query";
import { useAgentName } from "@/hooks/api/use-agent-name-query";
import { usePredictionByIdQuery } from "@/hooks/api/use-prediction-by-id-query";
import { useVerificationClaimByIdQuery } from "@/hooks/api/use-verification-claim-by-id-query";
import type {
  Prediction,
  TimeWindowParams,
  VerificationClaim,
  VerificationVerdict,
} from "@/lib/api-schemas";
import { extractClaimIdFromReasoning } from "@/lib/api-utils";
import { ActivityFilters, type FilterState } from "./activity-filters";
import {
  type ActivityType,
  getActivityTypeInfo,
} from "./activity-type-selector";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

function HighlightedText({
  fullText,
  highlight,
}: {
  fullText: string;
  highlight: string;
}) {
  if (!fullText || !highlight) return <span>{fullText || highlight}</span>;

  const index = fullText.toLowerCase().indexOf(highlight.toLowerCase());
  if (index === -1) return <span>{fullText}</span>;

  return (
    <span>
      {fullText.substring(0, index)}
      <span className="bg-amber-500/10 text-amber-300 px-1.5 py-1 rounded">
        {fullText.substring(index, index + highlight.length)}
      </span>
      {fullText.substring(index + highlight.length)}
    </span>
  );
}

interface AgentHistoryViewerProps {
  agentAddress: string;
  activityType: ActivityType;
  timeWindow?: TimeWindowParams;
  className?: string;
  itemsPerPage?: number;
  onOffsetChange?: (offset: number) => void;
  currentOffset?: number;
  totalItems?: number;
}

function PredictionItem({ item }: { item: Prediction }) {
  return (
    <div className="border-b border-border space-y-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm mr-1" variant="outline">
            {item.topic || "General"}
          </Badge>
          {item.tweet?.author_twitter_username ? (
            <Link
              href={`https://x.com/${item.tweet.author_twitter_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-green-200"
            >
              @{item.tweet.author_twitter_username}
            </Link>
          ) : (
            <span className="text-muted-foreground">@Unknown</span>
          )}
          ·<span>#{item.id}</span>·
          <span>
            Predicted <RelativeTime date={item.tweet?.tweet_timestamp || item.prediction_timestamp || item.inserted_at} />
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Verdict Popover */}
          {item.verification_verdict?.reasoning ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center border-emerald-600 text-emerald-600 hover:text-emerald-600 gap-1 hover:bg-emerald-600/10 cursor-pointer"
                >
                  <Gavel className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs">View Verdict</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Verification Verdict</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.verification_verdict.reasoning}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground cursor-not-allowed">
              <CircleSlash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs">No Verdict Yet</span>
            </div>
          )}

          {/* External Link */}
          {item.tweet?.url && (
            <Link
              href={item.tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-blue-300 text-xs"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              Post
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="leading-relaxed text-sm sm:text-base">
          <HighlightedText
            fullText={item.tweet?.full_text || item.prediction}
            highlight={item.prediction}
          />
        </p>
        {item.context && (
          <div className="p-3 bg-muted-foreground/5 rounded w-full overflow-x-auto">
            <div className="text-sm mb-2 text-muted-foreground">Context:</div>
            <div className="leading-relaxed text-xs sm:text-sm">
              {JSON.stringify(item.context, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimItem({ item }: { item: VerificationClaim }) {
  const { data: prediction, isLoading: predictionLoading } =
    usePredictionByIdQuery(item.prediction_id);

  // Format outcome text and determine badge color
  const getOutcomeConfig = (outcome: string) => {
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
  };

  const outcomeConfig = getOutcomeConfig(item.outcome);

  return (
    <div className="border-b border-border space-y-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm mr-1" variant="outline">
            Claim #{item.id}
          </Badge>
          <Badge
            className={`text-xs sm:text-sm mr-1 ${outcomeConfig.className}`}
            variant="outline"
          >
            {outcomeConfig.text}
          </Badge>
          <span>
            Submitted <RelativeTime date={item.inserted_at} />
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Related Prediction Link */}
          {prediction?.url && (
            <Link
              href={prediction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-blue-300 text-xs"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              Post
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Related Prediction */}
        {(prediction || predictionLoading) && (
          <div className="p-3 bg-muted-foreground/5 rounded">
            <div className="text-sm mb-2 text-muted-foreground flex items-center gap-2">
              Prediction #{item.prediction_id}:
              {predictionLoading && <LoadingDots size="sm" />}
            </div>
            {predictionLoading ? (
              <div className="h-4 bg-muted/40 rounded animate-pulse" />
            ) : prediction ? (
              <div className="leading-relaxed text-xs sm:text-sm">
                <HighlightedText
                  fullText={prediction.full_post || prediction.prediction}
                  highlight={prediction.prediction}
                />
              </div>
            ) : (
              <div className="leading-relaxed text-xs sm:text-sm text-muted-foreground">
                Prediction not found
              </div>
            )}
          </div>
        )}

        <p className="leading-relaxed text-sm sm:text-base break-all">
          {item.proof}
        </p>
      </div>
    </div>
  );
}

function VerdictItem({ item }: { item: VerificationVerdict }) {
  const { data: prediction, isLoading: predictionLoading } =
    usePredictionByIdQuery(item.prediction_id);

  // Extract claim ID from reasoning and fetch claim data
  const claimId = extractClaimIdFromReasoning(item.reasoning || "");
  const { data: claim, isLoading: claimLoading } =
    useVerificationClaimByIdQuery(claimId);
  const { agentName: claimAgentName } = useAgentName(
    claim?.inserted_by_address || ""
  );

  return (
    <div className="border-b border-border space-y-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm mr-1" variant="outline">
            Verdict #{item.id}
          </Badge>
          {!claimId && (
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-500 border-blue"
            >
              Verdict does not agree with any provided claims
            </Badge>
          )}
          <span>
            Submitted <RelativeTime date={item.inserted_at} />
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Related Prediction Link */}
          {prediction?.url && (
            <Link
              href={prediction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-blue-300 text-xs"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              Post
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Related Prediction */}
        {(prediction || predictionLoading) && (
          <div className="p-3 bg-muted-foreground/5 rounded">
            <div className="text-sm mb-2 text-muted-foreground flex items-center gap-2">
              Prediction #{item.prediction_id}:
              {predictionLoading && <LoadingDots size="sm" />}
            </div>
            {predictionLoading ? (
              <div className="h-4 bg-muted/40 rounded animate-pulse" />
            ) : prediction ? (
              <div className="leading-relaxed text-xs sm:text-sm">
                <HighlightedText
                  fullText={prediction.full_post || prediction.prediction}
                  highlight={prediction.prediction}
                />
              </div>
            ) : (
              <div className="leading-relaxed text-xs sm:text-sm text-muted-foreground">
                Prediction not found
              </div>
            )}
          </div>
        )}

        {/* Related Claim */}
        {claimId && (
          <div className="p-3 bg-muted-foreground/5 rounded">
            <div className="text-sm mb-2 text-muted-foreground flex items-center gap-2">
              Referenced Claim #{claimId}:
              {claimLoading && <LoadingDots size="sm" />}
            </div>
            {claimLoading ? (
              <div className="h-4 bg-muted/40 rounded animate-pulse" />
            ) : claim ? (
              <div className="leading-relaxed text-xs sm:text-sm space-y-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge
                    variant={
                      claim.outcome === "correct" ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {claim.outcome}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    by {claimAgentName}
                  </span>
                </div>
                <div className="break-all">{claim.proof}</div>
              </div>
            ) : (
              <div className="leading-relaxed text-xs sm:text-sm text-muted-foreground">
                Claim not found
              </div>
            )}
          </div>
        )}

        <p className="leading-relaxed text-sm sm:text-base break-all">
          {item.reasoning}
        </p>
      </div>
    </div>
  );
}

function TaskItem({
  item,
}: {
  item: { id?: string | number; inserted_at?: string };
}) {
  return (
    <div className="border-b border-border space-y-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm">
          <Badge className="text-xs sm:text-sm mr-1" variant="outline">
            Task #{item.id || "N/A"}
          </Badge>
          <Badge className="text-xs sm:text-sm mr-1" variant="outline">
            Completed
          </Badge>
          <span>
            <RelativeTime date={item.inserted_at || new Date().toISOString()} />
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* No external link for tasks currently */}
        </div>
      </div>

      <div className="space-y-2">
        <p className="leading-relaxed text-sm sm:text-base text-muted-foreground italic">
          Task details not available yet
        </p>
      </div>
    </div>
  );
}

export function AgentHistoryViewer({
  agentAddress,
  activityType,
  timeWindow,
  className,
  itemsPerPage = 100,
  onOffsetChange,
  currentOffset = 0,
  totalItems,
}: AgentHistoryViewerProps) {
  const typeInfo = getActivityTypeInfo(activityType);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    topic: "crypto",
    claims: activityType === "claims" ? "all" : undefined,
  });

  // Handle search term changes with pagination reset
  const handleSearchChange = useCallback(
    (newSearchTerm: string) => {
      if (newSearchTerm !== searchTerm) {
        setSearchTerm(newSearchTerm);
        onOffsetChange?.(0);
      }
    },
    [searchTerm, onOffsetChange]
  );

  // Handle filter changes with pagination reset
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      onOffsetChange?.(0);
    },
    [onOffsetChange]
  );

  // Calculate current page from offset
  const currentPage = Math.floor(currentOffset / itemsPerPage) + 1;

  const { data, isLoading, error } = useAgentActivityByType(
    agentAddress,
    activityType === "tasks" ? "predictions" : activityType,
    {
      timeWindow,
      limit: itemsPerPage,
      offset: currentOffset,
      search: searchTerm || undefined,
      sort_order: "desc",
    }
  );

  const sortedData = useMemo(() => {
    if (!data) return [];

    // Apply client-side filtering
    const filtered = data.filter((item) => {
      // Topic filter (for predictions)
      if (activityType === "predictions" && filters.topic !== "all") {
        const prediction = item as Prediction;
        const itemTopic = prediction.topic?.toLowerCase() || "";
        if (!itemTopic.includes(filters.topic.toLowerCase())) {
          return false;
        }
      }

      // Claims filter (for claims)
      if (
        activityType === "claims" &&
        filters.claims &&
        filters.claims !== "all"
      ) {
        const claim = item as VerificationClaim;
        if (claim.outcome !== filters.claims) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [data, filters, activityType]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * itemsPerPage;
    if (onOffsetChange) {
      onOffsetChange(newOffset);
    }
  };

  // Calculate totalItems based on search state
  const actualTotalItems = (() => {
    // When not searching, use provided totalItems from parent
    if (!searchTerm && totalItems) {
      return totalItems;
    }

    // For search results or when no totalItems provided, estimate based on current page
    const hasMorePages = sortedData.length === itemsPerPage;
    return hasMorePages
      ? currentPage * itemsPerPage + 1 // At least one more item
      : (currentPage - 1) * itemsPerPage + sortedData.length;
  })();

  const hasMorePages = actualTotalItems > currentPage * itemsPerPage;

  const renderItem = (
    item:
      | Prediction
      | VerificationClaim
      | VerificationVerdict
      | Record<string, unknown>,
    index: number
  ) => {
    const key = `${activityType}-${item.id || index}`;

    switch (activityType) {
      case "predictions":
        return <PredictionItem key={key} item={item as Prediction} />;
      case "claims":
        return <ClaimItem key={key} item={item as VerificationClaim} />;
      case "verdicts":
        return <VerdictItem key={key} item={item as VerificationVerdict} />;
      case "tasks":
        return <TaskItem key={key} item={item} />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent>
          <p>
            ERROR_LOADING_{activityType.toUpperCase()}: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <SearchInput
          placeholder="Search..."
          onSearchChange={handleSearchChange}
          value={searchTerm}
          className="flex-1"
        />
        <ActivityFilters
          activityType={activityType}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          className="w-full sm:w-auto sm:flex-shrink-0"
        />
      </div>

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {typeInfo && (
              <typeInfo.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            )}
            <p>NO {typeInfo?.label.toUpperCase()} FOUND</p>
            <p className="mt-2 text-sm">
              This agent has no {typeInfo?.label.toLowerCase()} in the selected
              time period.
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-[46vh] overflow-y-auto">
              {sortedData.map(renderItem)}
            </div>

            {sortedData.length > 0 && (hasMorePages || currentPage > 1) && (
              <div className="pt-6 border-t border-border">
                <Pagination
                  currentPage={currentPage}
                  totalItems={actualTotalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
