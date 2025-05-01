"use client";

import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { AgentApplicationCard } from "~/app/(pages)/whitelist-applications/_components/agent-application-card";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAgentApplications } from "hooks/use-agent-applications";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";

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

const EmptyState = () => (
  <ContentNotFound message="No Whitelist Applications matching the search criteria were found." />
);

const ErrorState = ({ message }: { message: string }) => (
  <p>Error loading agent data: {message}</p>
);

export const ListWhitelistApplications = () => {
  const { selectedAccount } = useGovernance();
  const searchParams = useSearchParams();

  const search = searchParams.get("search");
  const statusFilter = searchParams.get("whitelist-status");

  const { applications, isLoading, error } = useAgentApplications({
    search,
    statusFilter,
  });

  const { data: votesPerUserKey } = api.agentApplicationVote.byUserKey.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount },
  );

  if (isLoading) return <ListCardsLoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (applications.length === 0) return <EmptyState />;

  return (
    <ScrollArea className="h-[33.9rem]">
      <div className="flex flex-col gap-4 pb-4">
        {applications.map((app) => {
          const userVoted = votesPerUserKey?.find(
            (vote) => vote.applicationId == app.id,
          );

          return (
            <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
              <AgentApplicationCard
                title={app.title}
                author={app.payerKey}
                agentApplicationStatus={app.rawStatus}
                activeAgent={app.isActiveAgent}
                agentVoted={userVoted?.vote}
                agentApplicationId={app.id}
                whitelistStatus={app.status}
              />
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
};
