"use client";

import { ListChecks } from "lucide-react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import DashboardRedirectCard from "./dashboard-redirect-card";
import Link from "next/link";
import { AgentApplicationCard } from "~/app/(pages)/whitelist-applications/_components/agent-application-card";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { useAgentApplications } from "hooks/use-agent-applications";

export default function DashboardPendingDaoApplicationsCard() {
  const { applications: pendingApplications, isLoading } = useAgentApplications(
    {
      filterByStatus: "Open", // Only show Open applications
    },
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    }

    if (pendingApplications.length === 0) {
      return <ContentNotFound message="No pending applications found" />;
    }

    return pendingApplications.map((application) => (
      <Link
        href={`/agent-application/${application.id}`}
        key={application.id}
        prefetch
      >
        <AgentApplicationCard
          variant="small"
          title={application.title}
          author={application.payerKey}
          agentApplicationStatus={application.rawStatus}
          activeAgent={application.isActiveAgent}
          agentApplicationId={application.id}
          whitelistStatus={application.status}
        />
      </Link>
    ));
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
