"use client";

import { ListChecks } from "lucide-react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import DashboardRedirectCard from "./dashboard-redirect-card";
import Link from "next/link";
import { AgentApplicationCard } from "~/app/(pages)/whitelist-applications/_components/agent-application-card";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { useAgentApplications } from "hooks/use-agent-applications";
import { ScrollFadeEffect } from "~/app/_components/scroll-fade-effect";

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
          <CardSkeleton variant="small" />
          <CardSkeleton variant="small" />
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
      redirectPath="/whitelist-applications"
      icon={ListChecks}
    >
      <div className="relative">
        <ScrollArea className="sm:max-h-32 max-h-48 h-48">
          <div className="flex flex-col gap-2">{renderContent()}</div>
        </ScrollArea>
        <ScrollFadeEffect />
      </div>
    </DashboardRedirectCard>
  );
}
