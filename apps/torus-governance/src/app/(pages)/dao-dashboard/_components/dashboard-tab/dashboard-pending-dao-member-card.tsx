"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import DashboardRedirectCard from "./dashboard-redirect-card";
import { ScrollFadeEffect } from "~/app/_components/scroll-fade-effect";

export default function DashboardPendingDaoMemberCard() {
  const { data: pendingCandidates, isLoading } =
    api.cadreCandidate.filteredByStatusWithDiscord.useQuery({
      status: "PENDING",
    });

  const pendingCount = pendingCandidates?.length ?? 0;

  return (
    <DashboardRedirectCard
      title="Pending DAO Member Applications"
      redirectPath="/dao-dashboard?tab=dao-applications"
      icon={UserRound}
    >
      <div className="relative">
        <ScrollArea className="sm:max-h-[7.8rem] h-48 max-h-48">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <CardSkeleton variant="small" />
                <CardSkeleton variant="small" />
              </div>
            ) : pendingCount === 0 ? (
              <ContentNotFound message="No pending DAO member applications." />
            ) : (
              <div className="flex flex-col gap-3 pb-2">
                {pendingCandidates?.map((candidate) => (
                  <div
                    key={candidate.userKey}
                    className="border-b border-border py-2 hover:bg-accent px-1"
                  >
                    <Link
                      href="/dao-portal"
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {candidate.userName ?? "Unknown User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {smallAddress(candidate.userKey, 10)}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <ScrollFadeEffect />
      </div>
    </DashboardRedirectCard>
  );
}
