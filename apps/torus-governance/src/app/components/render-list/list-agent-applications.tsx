"use client";
import Link from "next/link";
import { handleCustomAgentApplications } from "~/utils";
import { CardViewData } from "../card-view-data";
import { useGovernance } from "~/context/governance-provider";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { CardSkeleton } from "../card-skeleton";
import { ListContainer } from "./list-container";

const ListCardsLoadingSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      <div className="animate-fade-up animate-delay-200">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-500">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-700">
        <CardSkeleton />
      </div>
    </div>
  );
};

export const ListAgentApplications = () => {
  const { agentApplicationsWithMeta, isInitialized, agentApplications } =
    useGovernance();
  const searchParams = useSearchParams();
  const { data: activeAgents } = api.agent.all.useQuery();

  const isLoadingagentApplications = () => {
    if (
      !agentApplicationsWithMeta ||
      agentApplications.isPending ||
      !isInitialized
    )
      return true;
    return false;
  };

  const filteredAgentApplications = agentApplicationsWithMeta?.map((app) => {
    const { title, body } = handleCustomAgentApplications(
      app.id,
      app.customData ?? null,
    );

    if (!body) return;

    const search = searchParams.get("search")?.toLocaleLowerCase();
    // const whitelistStatusFilter = searchParams
    //   .get("whitelist-status")
    //   ?.toLocaleLowerCase();

    if (
      search &&
      !title?.toLocaleLowerCase().includes(search) &&
      !body.toLocaleLowerCase().includes(search) &&
      !app.payerKey.toLocaleLowerCase().includes(search) &&
      !app.agentKey.toLocaleLowerCase().includes(search)
    )
      return;

    const isActiveAgent = !!activeAgents?.find(
      (agent) => agent.key === app.agentKey,
    );

    return (
      <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
        <CardViewData
          title={title}
          author={app.payerKey}
          agentApplicationStatus={app.status}
          activeAgent={isActiveAgent}
        />
      </Link>
    );
  });

  if (isLoadingagentApplications()) return <ListCardsLoadingSkeleton />;
  if (!filteredAgentApplications)
    return <p>No agent/module applications found.</p>;

  return <ListContainer>{filteredAgentApplications}</ListContainer>;
};
