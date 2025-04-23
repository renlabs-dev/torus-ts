"use client";

import { ListChecks } from "lucide-react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import DashboardRedirectCard from "./dashboard-redirect-card";
import Link from "next/link";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomAgentApplications } from "~/utils";
import { AgentApplicationCard } from "~/app/(pages)/whitelist-applications/_components/agent-application-card";
import { match } from "rustie";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";

const mapStatusToView = (status: any): string => {
  return match(status)({
    Open: () => "active",
    Resolved: ({ accepted }: { accepted: boolean }) =>
      accepted ? "accepted" : "refused",
    Expired: () => "expired",
  });
};

export default function DashboardPendingDaoApplicationsCard() {
  const {
    agentApplicationsWithMeta,
    agentApplications,
    isInitialized,
    agents,
  } = useGovernance();

  const isLoading =
    !agentApplicationsWithMeta ||
    agentApplications.isPending ||
    !isInitialized ||
    agents.isPending;

  // Display only active (Open) applications
  const pendingApplications = agentApplicationsWithMeta
    ?.filter((app) => app.status.type === "Open")
    .map((app) => {
      const { title, body } = handleCustomAgentApplications(
        app.id,
        app.customData ?? null,
      );

      if (!body) return null;

      const status = mapStatusToView(app.status);
      const isActiveAgent = agents.data?.has(app.agentKey);

      return (
        <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
          <AgentApplicationCard
            title={title}
            author={app.payerKey}
            agentApplicationStatus={app.status}
            activeAgent={isActiveAgent}
            agentApplicationId={app.id}
            whitelistStatus={status}
          />
        </Link>
      );
    })
    .filter(Boolean)
    .slice(0, 3); // Limit to 3 most recent applications

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    }

    if (!pendingApplications || pendingApplications.length === 0) {
      return <ContentNotFound message="No pending applications found" />;
    }

    return pendingApplications;
  };

  return (
    <DashboardRedirectCard
      title="Pending Whitelist Applications"
      redirectPath="/dao-applications"
      icon={ListChecks}
    >
      <ScrollArea className="h-[300px]">
        <div className="flex flex-col gap-4">{renderContent()}</div>
      </ScrollArea>
    </DashboardRedirectCard>
  );
}
