"use client";
import type { AgentApplication } from "@torus-ts/subspace";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { match } from "rustie";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { handleCustomAgentApplications } from "~/utils";
import { CardSkeleton } from "../card-skeleton";
import { CardViewData } from "../card-view-data";
import { ListContainer } from "./container-list";

const ListCardsLoadingSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      {[200, 500, 700].map((delay) => (
        <div key={delay} className={`animate-fade-up animate-delay-${delay}`}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
};

const fromStatusToView = (status: AgentApplication["status"]) => {
  return match(status)({
    Open: () => "active",
    Resolved: ({ accepted }) => (accepted ? "accepted" : "refused"),
    Expired: () => "expired",
  });
};

export const ListAgentApplications = () => {
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
      .map((app) => {
        const { title, body } = handleCustomAgentApplications(
          app.id,
          app.customData ?? null,
        );

        if (!body) return null;

        const status = fromStatusToView(app.status);

        const matchesSearch = search
          ? // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            title?.toLowerCase().includes(search) ||
            body.toLowerCase().includes(search) ||
            app.payerKey.toLowerCase().includes(search) ||
            app.agentKey.toLowerCase().includes(search)
          : true;

        const matchesStatus = statusFilter === "all" || status === statusFilter;

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
            />
          </Link>
        );
      })
      .filter(Boolean);
  }, [agentApplicationsWithMeta, searchParams, activeAgents, votesPerUserKey]);

  if (isLoading) return <ListCardsLoadingSkeleton />;

  if (activeAgentsError) {
    return <p>Error loading agent data: {activeAgentsError.message}</p>;
  }

  if (filteredAgentApplications.length === 0) {
    return (
      <p className="animate-fade-down duration-500">
        No agent/module applications found.
      </p>
    );
  }

  return (
    <ListContainer
      smallesHeight={320}
      className="max-h-[calc(100svh-320px)] md:max-h-[calc(100svh-425px)]"
    >
      {filteredAgentApplications}
    </ListContainer>
  );
};
