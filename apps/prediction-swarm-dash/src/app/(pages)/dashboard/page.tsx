"use client";

import { BarChart3, User } from "lucide-react";
import Link from "next/link";
import React from "react";

import type { DateRangeFilterData } from "@/components/date-range-filter";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      <div className="animate-in fade-in slide-in-from-bottom duration-1000 delay-200 fill-mode-both">
        <DashboardStats timeWindow={timeWindow} />
      </div>

      <div className="flex items-center justify-center mt-12 w-full px-[2.1em] sm:px-0">
        <div className="flex flex-col max-w-screen-xl w-full gap-6">
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 w-full",
              "animate-in fade-in slide-in-from-bottom duration-1000 delay-400 fill-mode-both"
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
          <div className="flex flex-col gap-3 mb-12">
            <div className="flex flex-col md:flex-row gap-3 md:h-[600px]">
              <div
                className={cn(
                  "w-full md:w-[65%] h-[600px] md:h-full",
                  "animate-in fade-in slide-in-from-bottom-10 duration-600 delay-600 fill-mode-both"
                )}
              >
                <DashboardAgents timeWindow={timeWindow} />
              </div>

              <div className="w-full md:w-[35%] flex flex-col gap-3">
                <Card
                  className={cn(
                    "h-[400px] sm:max-h-[294px] md:h-1/2",
                    "animate-in fade-in slide-in-from-bottom-10 duration-600 delay-800 fill-mode-both"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="bg-muted-foreground/35 w-fit p-2 rounded-md">
                      /LIVE-SWARM-ACTIVITY-FEED
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] pb-4">
                    <div className="h-full overflow-y-auto pr-2 -mr-2">
                      <div className="pb-4">
                        <DashboardActivity timeWindow={timeWindow} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "h-[400px] sm:max-h-[294px] md:h-1/2",
                    "animate-in fade-in slide-in-from-bottom-10 duration-600 delay-1000 fill-mode-both"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="bg-muted-foreground/35 w-fit p-2 rounded-md">
                      /PERMISSION-BREAKDOWN
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] pb-4">
                    <div className="h-full overflow-y-auto pr-2 -mr-2">
                      <div className="pb-4">
                        <DashboardPermissions />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-1200 fill-mode-both">
                <CardHeader>
                  <CardTitle className="bg-muted-foreground/35 w-fit p-2 rounded-md flex items-center">
                    /AGENT-ANALYSIS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Access comprehensive agent analytics, activity history, and
                    permission details for individual agents.
                  </p>
                  <Link href="/agents">
                    <Button variant="outline" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Open agent analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-1400 fill-mode-both">
                <CardHeader>
                  <CardTitle className="bg-muted-foreground/35 w-fit p-2 rounded-md flex items-center">
                    /AGENT-COMPARISON
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Compare up to 4 agents side-by-side with interactive charts,
                    ranking systems, and detailed metrics analysis.
                  </p>
                  <Link href="/comparison">
                    <Button variant="outline" className="w-full">
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
