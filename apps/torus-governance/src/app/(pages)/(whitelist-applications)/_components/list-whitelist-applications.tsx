"use client";

import type { AgentApplication } from "@torus-network/sdk";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { handleCustomAgentApplications } from "~/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { match } from "rustie";
import { CardSkeleton } from "../../../_components/dao-content-card/card-skeleton";
import { CardViewData } from "../../../_components/dao-content-card/card-view-data";

const ListCardsLoadingSkeleton = () => {
  const delayValues = [200, 500, 700];

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
  <p className="animate-fade-down duration-500">
    No agent/module applications found.
  </p>
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
  } = useGovernance();

  const searchParams = useSearchParams();

  const {
    data: activeAgents,
    isLoading: isLoadingActiveAgents,
    error: activeAgentsError,
  } = api.agent.all.useQuery();

  const { data: votesPerUserKey } = api.agentApplicationVote.byUserKey.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount },
  );

  const isLoading =
    !agentApplicationsWithMeta ||
    agentApplications.isPending ||
    !isInitialized ||
    isLoadingActiveAgents;

  const filteredAgentApplications = useMemo(() => {
    if (!agentApplicationsWithMeta) return [];

    const search = searchParams.get("search")?.toLowerCase();
    const statusFilter = searchParams.get("whitelist-status")?.toLowerCase();

    return agentApplicationsWithMeta
      .reverse()
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

        const isActiveAgent = activeAgents?.some(
          (agent) => agent.key === app.agentKey,
        );

        const userVoted = votesPerUserKey?.find(
          (vote) => vote.applicationId === app.id,
        );

        return (
          <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
            <CardViewData
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
  }, [agentApplicationsWithMeta, searchParams, activeAgents, votesPerUserKey]);

  if (isLoading) return <ListCardsLoadingSkeleton />;
  if (activeAgentsError)
    return <ErrorState message={activeAgentsError.message} />;
  if (filteredAgentApplications.length === 0) return <EmptyState />;

  return filteredAgentApplications;
};
