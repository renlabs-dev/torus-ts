"use client";

import type { AgentApplication } from "@torus-network/sdk";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { AgentApplicationCard } from "~/app/(pages)/whitelist-applications/_components/agent-application-card";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { handleCustomAgentApplications } from "~/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { match } from "rustie";

const ListCardsLoadingSkeleton = () => {
  const delayValues = [200, 500, 700, 1000];

  return (
    <div className="w-full space-y-4">
      {delayValues.map((delay) => (
        <div key={delay} className={`animate-fade-up animate-delay-${delay}`}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
};

const mapStatusToView = (status: AgentApplication["status"]): string => {
  return match(status)({
    Open: () => "active",
    Resolved: ({ accepted }) => (accepted ? "accepted" : "refused"),
    Expired: () => "expired",
  });
};

const EmptyState = () => (
  <ContentNotFound message="No Whitelist Applications matching the search criteria were found." />
);

const ErrorState = ({ message }: { message: string }) => (
  <p>Error loading agent data: {message}</p>
);

export const ListWhitelistApplications = () => {
  const {
    agentApplicationsWithMeta,
    isInitialized,
    agentApplications,
    selectedAccount,
    agents,
  } = useGovernance();

  console.log("AgentsApplicationsWithMeta: ", agentApplicationsWithMeta);
  console.log("AggentsApplication: ", agentApplications);

  const searchParams = useSearchParams();

  const { data: votesPerUserKey } = api.agentApplicationVote.byUserKey.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount },
  );

  const isLoading =
    !agentApplicationsWithMeta ||
    agentApplications.isPending ||
    !isInitialized ||
    agents.isPending;

  const filteredAgentApplications = useMemo(() => {
    if (!agentApplicationsWithMeta) return [];

    const search = searchParams.get("search")?.toLowerCase();
    const statusFilter = searchParams.get("whitelist-status")?.toLowerCase();

    // Create a stable copy in reverse order
    const reversedApplications = [...agentApplicationsWithMeta].reverse();

    return reversedApplications
      .map((app) => {
        const { title, body } = handleCustomAgentApplications(
          app.id,
          app.customData ?? null,
        );

        if (!body) return null;

        const status = mapStatusToView(app.status);

        const matchesSearch =
          !search ||
          (title?.toLowerCase() ?? "").includes(search) ||
          body.toLowerCase().includes(search) ||
          app.payerKey.toLowerCase().includes(search) ||
          app.agentKey.toLowerCase().includes(search);

        const matchesStatus =
          !statusFilter || statusFilter === "all" || status === statusFilter;

        if (!matchesSearch || !matchesStatus) return null;

        const isActiveAgent = agents.data?.has(app.agentKey);

        const userVoted = votesPerUserKey?.find(
          (vote) => vote.applicationId === app.id,
        );

        return (
          <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
            <AgentApplicationCard
              title={title}
              author={app.payerKey}
              agentApplicationStatus={app.status}
              activeAgent={isActiveAgent}
              agentVoted={userVoted?.vote}
              agentApplicationId={app.id}
              whitelistStatus={status}
            />
          </Link>
        );
      })
      .filter(Boolean);
  }, [agentApplicationsWithMeta, searchParams, agents.data, votesPerUserKey]);

  if (isLoading) return <ListCardsLoadingSkeleton />;
  if (agents.error) return <ErrorState message={agents.error.message} />;
  if (filteredAgentApplications.length === 0) return <EmptyState />;

  return filteredAgentApplications;
};
