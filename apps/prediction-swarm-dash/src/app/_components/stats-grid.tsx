"use client";

import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { Container } from "~/app/_components/container";
import { useStreamAgentsQuery, useSwarmTotalMetrics } from "~/hooks/api";
import Link from "next/link";

const DEFAULT_STREAM_ID =
  "0x1e3a46555c704698c6484ea3388134d590525cd8a6cc95f479420ce56fc5a346";

export function StatsGrid() {
  const {
    totalPredictions,
    totalVerificationClaims,
    totalActiveAgents,
    totalVerificationVerdicts,
    totalTasksCompleted,
    isLoading,
  } = useSwarmTotalMetrics();

  const { totalAgentsInStream, isLoading: totalAgentsLoading } =
    useStreamAgentsQuery(DEFAULT_STREAM_ID);

  const stats = [
    { value: totalPredictions, label: "Total predictions", isLoading },
    {
      value: totalVerificationClaims,
      label: "Claims processed",
      isLoading,
    },
    {
      value: totalVerificationVerdicts,
      label: "Verdicts processed",
      isLoading,
    },
    {
      value: totalAgentsInStream,
      label: "Agents in swarm",
      isLoading: totalAgentsLoading,
    },
    { value: totalActiveAgents, label: "Writing to memory", isLoading },
    { value: totalTasksCompleted, label: "Tasks completed", isLoading },
  ];

  return (
    <Container>
      <div className="my-36 w-full">
        <h2 className="text-foreground mb-4 text-2xl font-extralight">
          Prediction Swarm
          <span className="text-muted-foreground text-base"> /Statistics</span>
        </h2>
        <div className="border-border grid w-full grid-cols-3 grid-rows-2 rounded-md border">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "border-border flex min-h-[160px] w-full items-end justify-start p-8",
                i % 3 !== 2 && "border-r",
                i < 3 && "border-b",
              )}
            >
              <div className="flex flex-col">
                <div className="text-xl font-semibold">
                  {stat.isLoading ? "..." : stat.value.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="-mt-5 flex justify-center">
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="bg-background rounded-md"
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
