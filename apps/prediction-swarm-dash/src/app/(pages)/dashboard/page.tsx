"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { cn } from "@torus-ts/ui/lib/utils";
import type { DateRangeFilterData } from "~/app/_components/date-range-filter";
import { DateRangeFilter } from "~/app/_components/date-range-filter";
import { BarChart3, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DashboardActivity } from "./components/dashboard-activity";
import { DashboardAgents } from "./components/dashboard-agents";
import { DashboardPermissions } from "./components/dashboard-permissions";
import { DashboardStats } from "./components/dashboard-stats";

function DashboardContent() {
  const [dateFilters, setDateFilters] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});

  const timeWindow = {
    from: dateFilters.from?.toISOString(),
    to: dateFilters.to?.toISOString(),
  };
  return (
    <div className="flex flex-1 flex-col">
      <div className="animate-in fade-in slide-in-from-bottom fill-mode-both delay-200 duration-1000">
        <DashboardStats timeWindow={timeWindow} />
      </div>

      <div className="mt-12 flex w-full items-center justify-center px-[2.1em] sm:px-0">
        <div className="flex w-full max-w-screen-xl flex-col gap-6">
          <div
            className={cn(
              "flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
              "animate-in fade-in slide-in-from-bottom delay-400 fill-mode-both duration-1000",
            )}
          >
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                Prediction Swarm
              </span>
              <h1 className="text-3xl font-bold">Agents Analysis</h1>
            </div>
            <DateRangeFilter
              onSubmit={(data: DateRangeFilterData) => {
                setDateFilters({
                  from: data.from,
                  to: data.to,
                });
              }}
              defaultValues={{
                from: dateFilters.from,
                to: dateFilters.to,
              }}
            />
          </div>
          <div className="mb-12 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:h-[600px] md:flex-row">
              <div
                className={cn(
                  "h-[600px] w-full md:h-full md:w-[65%]",
                  "animate-in fade-in slide-in-from-bottom-10 duration-600 delay-600 fill-mode-both",
                )}
              >
                <DashboardAgents timeWindow={timeWindow} />
              </div>

              <div className="flex w-full flex-col gap-3 md:w-[35%]">
                <Card
                  className={cn(
                    "h-[400px] sm:max-h-[294px] md:h-1/2",
                    "animate-in fade-in slide-in-from-bottom-10 duration-600 delay-800 fill-mode-both",
                  )}
                >
                  <CardHeader>
                    <CardTitle className="bg-muted-foreground/35 w-fit rounded-md p-2">
                      /LIVE-SWARM-ACTIVITY-FEED
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] pb-4">
                    <div className="-mr-2 h-full overflow-y-auto pr-2">
                      <div className="pb-4">
                        <DashboardActivity timeWindow={timeWindow} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "h-[400px] sm:max-h-[294px] md:h-1/2",
                    "animate-in fade-in slide-in-from-bottom-10 duration-600 fill-mode-both delay-1000",
                  )}
                >
                  <CardHeader>
                    <CardTitle className="bg-muted-foreground/35 w-fit rounded-md p-2">
                      /PERMISSION-BREAKDOWN
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] pb-4">
                    <div className="-mr-2 h-full overflow-y-auto pr-2">
                      <div className="pb-4">
                        <DashboardPermissions />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Card className="animate-in fade-in slide-in-from-bottom-10 delay-1200 fill-mode-both duration-1000">
                <CardHeader>
                  <CardTitle className="bg-muted-foreground/35 flex w-fit items-center rounded-md p-2">
                    /AGENT-ANALYSIS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Access comprehensive agent analytics, activity history, and
                    permission details for individual agents.
                  </p>
                  <Link href="/agents">
                    <Button variant="outline" className="w-full rounded-sm">
                      <User className="mr-2 h-4 w-4" />
                      Open agent analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="animate-in fade-in slide-in-from-bottom-10 delay-1400 fill-mode-both duration-1000">
                <CardHeader>
                  <CardTitle className="bg-muted-foreground/35 flex w-fit items-center rounded-md p-2">
                    /AGENT-COMPARISON
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Compare up to 4 agents side-by-side with interactive charts,
                    ranking systems, and detailed metrics analysis.
                  </p>
                  <Link href="/comparison">
                    <Button variant="outline" className="w-full rounded-sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Compare agents
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <DashboardContent />;
}
