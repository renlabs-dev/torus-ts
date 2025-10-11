"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { LoadingDots } from "~/app/_components/loading-dots";
import { RankBadge } from "~/app/_components/rank-badge";
import { useAgentContributionStatsQuery } from "~/hooks/api";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import type {
  AgentContributionStatsItem,
  TimeWindowParams,
} from "~/lib/api-schemas";
import { formatLargeNumber } from "~/lib/api-utils";
import Link from "next/link";
import { useMemo, useState } from "react";

type MetricFilter = "all" | "predictions" | "verdicts" | "claims";

interface AgentRowProps {
  agent: AgentContributionStatsItem;
  index: number;
  filter: MetricFilter;
}

function AgentRow({ agent, index, filter }: AgentRowProps) {
  const { agentName } = useAgentName(agent.wallet_address);

  // Find the metric to display
  const metrics = [
    { value: agent.num_predictions_submitted, label: "predictions" },
    { value: agent.num_verification_verdicts_submitted, label: "verdicts" },
    { value: agent.num_verification_claims_submitted, label: "claims" },
  ];

  const displayMetric =
    filter === "all"
      ? metrics.reduce((max, metric) =>
          metric.value > max.value ? metric : max,
        )
      : (metrics.find((m) => m.label === filter) ?? metrics[0]);

  if (!displayMetric) {
    return null;
  }

  return (
    <Link href={`/agents?agent=${encodeURIComponent(agent.wallet_address)}`}>
      <div className="hover:bg-muted/50 border-border/40 flex cursor-pointer items-center justify-between border-b p-2">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <RankBadge rank={index + 1} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{agentName}</div>
            <div className="text-muted-foreground truncate font-mono">
              {smallAddress(agent.wallet_address)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold">
            {formatLargeNumber(displayMetric.value)}
            <span className="text-muted-foreground text-sm font-thin">
              /{displayMetric.label}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

interface DashboardAgentsProps {
  timeWindow?: TimeWindowParams;
}

export function DashboardAgents({ timeWindow }: DashboardAgentsProps) {
  const { data, isLoading, error } = useAgentContributionStatsQuery(timeWindow);
  const [filter, setFilter] = useState<MetricFilter>("all");

  // Sort agents based on selected filter
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const topAgents = useMemo(() => {
    if (!data?.agent_contribution_stats) return [];

    const agents = data.agent_contribution_stats.map((agent) => ({
      ...agent,
      totalActivity:
        agent.num_predictions_submitted +
        agent.num_verification_claims_submitted +
        agent.num_verification_verdicts_submitted +
        agent.num_tasks_completed,
    }));

    // Sort based on filter
    const sorted = agents.sort((a, b) => {
      switch (filter) {
        case "predictions":
          return b.num_predictions_submitted - a.num_predictions_submitted;
        case "verdicts":
          return (
            b.num_verification_verdicts_submitted -
            a.num_verification_verdicts_submitted
          );
        case "claims":
          return (
            b.num_verification_claims_submitted -
            a.num_verification_claims_submitted
          );
        default:
          return b.totalActivity - a.totalActivity;
      }
    });

    return sorted.slice(0, 15);
  }, [data?.agent_contribution_stats, filter]);

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <p>ERROR_LOADING_AGENT_DATA: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="bg-muted-foreground/35 w-fit rounded-md p-2">
            /TOP-PERFORMING-AGENTS
          </CardTitle>
          <div className="hidden items-center gap-1 text-xs md:flex">
            {(
              ["all", "predictions", "verdicts", "claims"] as MetricFilter[]
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-md px-3 py-1 transition-colors ${
                  filter === option
                    ? "bg-muted-foreground/35 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        ) : (
          <div className="-mr-2 h-full overflow-y-auto pr-2">
            <div className="">
              {topAgents.map((agent, index) => (
                <AgentRow
                  key={agent.wallet_address}
                  agent={agent}
                  index={index}
                  filter={filter}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
