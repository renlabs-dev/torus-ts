"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { cn } from "@torus-ts/ui/lib/utils";
import { ActivityTypeSelector } from "~/app/_components/activity-type-selector";
import type { ActivityType } from "~/app/_components/activity-type-selector";
import { AgentHistoryViewer } from "~/app/_components/agent-history-viewer";
import { Container } from "~/app/_components/container";
import { CopyButton } from "~/app/_components/copy-button";
import { DateRangeFilter } from "~/app/_components/date-range-filter";
import type { DateRangeFilterData } from "~/app/_components/date-range-filter";
import { LoadingDots } from "~/app/_components/loading-dots";
import { PermissionBadges } from "~/app/_components/permission-badges";
import { useAgentDetailedMetrics } from "~/hooks/api/use-agent-detailed-metrics-query";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { dateToISOStringSafe } from "~/lib/api-utils";
import { useAuthStore } from "~/lib/auth-store";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useMemo } from "react";
import { AgentNoSelection } from "./components/agent-no-selection";

function AgentsPageContent() {
  const searchParams = useSearchParams();

  const { isAuthenticated } = useAuthStore();
  const [selectedAgent, setSelectedAgent] = React.useState<string>("");
  const [selectedActivityType, setSelectedActivityType] =
    React.useState<ActivityType>("predictions");
  const [searchFilters, setSearchFilters] = React.useState({
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
    limit: 50,
    offset: 0,
  });

  React.useEffect(() => {
    const agentParam = searchParams.get("agent");
    if (agentParam) {
      setSelectedAgent(decodeURIComponent(agentParam));
    }
  }, [searchParams]);

  const { agentName } = useAgentName(selectedAgent);

  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    permissions,
  } = useAgentDetailedMetrics(selectedAgent, {
    from: dateToISOStringSafe(searchFilters.from, false),
    to: dateToISOStringSafe(searchFilters.to, true),
  });

  const showCounts = useMemo(
    () =>
      selectedAgent
        ? {
            predictions: totalPredictions,
            claims: totalVerificationClaims,
            verdicts: totalVerificationVerdicts,
            tasks: totalTasksCompleted,
          }
        : undefined,
    [
      selectedAgent,
      totalPredictions,
      totalVerificationClaims,
      totalVerificationVerdicts,
      totalTasksCompleted,
    ],
  );

  // Determine the activity type with the most items
  const getDefaultActivityType = useCallback(
    (
      predictions: number,
      claims: number,
      verdicts: number,
      tasks: number,
    ): ActivityType => {
      const counts = {
        predictions,
        claims,
        verdicts,
        tasks,
      };

      // Find the activity type with the highest count
      const maxActivity = Object.entries(counts).reduce(
        (max, [activity, count]) =>
          count > max.count
            ? { activity: activity as ActivityType, count }
            : max,
        { activity: "predictions" as ActivityType, count: predictions },
      );

      return maxActivity.activity;
    },
    [],
  );

  // Update selected activity type when agent changes or when metrics are loaded
  React.useEffect(() => {
    if (
      selectedAgent &&
      (totalPredictions ||
        totalVerificationClaims ||
        totalVerificationVerdicts ||
        totalTasksCompleted)
    ) {
      const defaultActivity = getDefaultActivityType(
        totalPredictions,
        totalVerificationClaims,
        totalVerificationVerdicts,
        totalTasksCompleted,
      );
      setSelectedActivityType(defaultActivity);
    }
  }, [
    selectedAgent,
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
    totalTasksCompleted,
    getDefaultActivityType,
  ]);

  const getTotalItemsForActivity = useCallback(
    (
      activityType: ActivityType,
      totalPredictions: number,
      totalVerificationClaims: number,
      totalVerificationVerdicts: number,
      totalTasksCompleted: number,
    ): number => {
      if (activityType === "predictions") return totalPredictions;
      if (activityType === "claims") return totalVerificationClaims;
      if (activityType === "verdicts") return totalVerificationVerdicts;
      return totalTasksCompleted;
    },
    [],
  );

  const handleDateRangeFilterSubmit = useCallback(
    (data: DateRangeFilterData) => {
      setSearchFilters((prev) => ({
        ...prev,
        from: data.from,
        to: data.to,
        offset: 0, // Reset offset when filters change
      }));
    },
    [],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center justify-center py-8">
              <LoadingDots size="lg" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "mb-12 min-h-screen w-full border-none p-0",
        "animate-fade-down",
      )}
    >
      <CardHeader className="border-border border-t px-4 pt-6 md:px-6">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col">
          <div
            className={cn(
              "flex flex-col items-start gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between",
              "animate-fade-up animate-delay-[400ms]",
            )}
          >
            <CardTitle className="flex flex-col items-start text-xl md:text-2xl">
              {selectedAgent ? agentName : "Agent Analysis"}
              <div className="text-muted-foreground flex flex-row flex-wrap gap-2 text-xs md:text-sm">
                {selectedAgent && (
                  <>
                    <CopyButton text={selectedAgent} /> |
                    <span>
                      <PermissionBadges
                        permissions={permissions}
                        variant="compact"
                      />
                    </span>
                  </>
                )}
              </div>
            </CardTitle>
            <div
              className={cn(
                "flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end md:gap-3",
                "animate-fade-up animate-delay-[600ms]",
              )}
            >
              <DateRangeFilter
                onSubmit={handleDateRangeFilterSubmit}
                defaultValues={{
                  from: searchFilters.from,
                  to: searchFilters.to,
                }}
              />
              <Link href="/comparison" className="flex-1 sm:flex-none">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare</span>
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1 sm:flex-none">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardHeader>
      {selectedAgent && (
        <div
          className={cn(
            "border-border border-b px-4 md:px-6",
            "animate-fade-up animate-delay-[800ms]",
          )}
        >
          <div className="mx-auto mb-1.5 w-full max-w-screen-xl">
            <ActivityTypeSelector
              value={selectedActivityType}
              onValueChange={setSelectedActivityType}
              showCounts={showCounts}
            />
          </div>
        </div>
      )}
      <CardContent className="px-4 md:px-6">
        <Container>
          {selectedAgent && (
            <div
              className={cn(
                "mt-4 w-full",
                "animate-fade-up animate-delay-1000",
              )}
            >
              <AgentHistoryViewer
                agentAddress={selectedAgent}
                activityType={selectedActivityType}
                timeWindow={{
                  from: dateToISOStringSafe(searchFilters.from, false),
                  to: dateToISOStringSafe(searchFilters.to, true),
                }}
                itemsPerPage={searchFilters.limit || 50}
                onOffsetChange={(newOffset) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    offset: newOffset,
                  }));
                }}
                currentOffset={searchFilters.offset || 0}
                totalItems={getTotalItemsForActivity(
                  selectedActivityType,
                  totalPredictions,
                  totalVerificationClaims,
                  totalVerificationVerdicts,
                  totalTasksCompleted,
                )}
              />
            </div>
          )}

          {!selectedAgent && (
            <div className={cn("w-full", "animate-fade-up animate-delay-1000")}>
              <AgentNoSelection />
            </div>
          )}
        </Container>
      </CardContent>
    </Card>
  );
}

function AgentsPageFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center justify-center py-8">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<AgentsPageFallback />}>
      <AgentsPageContent />
    </Suspense>
  );
}
