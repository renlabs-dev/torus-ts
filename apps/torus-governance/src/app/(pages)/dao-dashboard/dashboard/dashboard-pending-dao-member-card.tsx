"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { Button } from "@torus-ts/ui/components/button";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import DashboardRedirectCard from "./dashboard-redirect-card";

export default function DashboardPendingDaoMemberCard() {
  const { data: pendingCandidates, isLoading } =
    api.cadreCandidate.filteredByStatusWithDiscord.useQuery({
      status: "PENDING",
    });

  const pendingCount = pendingCandidates?.length ?? 0;

  return (
    <DashboardRedirectCard
      title="Pending DAO Member Applications"
      redirectPath="/dao-applications"
      icon={UserRound}
    >
      <ScrollArea className="h-[130px]">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton variant="small" />
              <CardSkeleton variant="small" />
            </div>
          ) : pendingCount === 0 ? (
            <ContentNotFound message="No pending DAO member applications." />
          ) : (
            <ScrollArea>
              <div className="flex flex-col gap-3 pr-2">
                {pendingCandidates?.map((candidate) => (
                  <div
                    key={candidate.userKey}
                    className="border-b border-border py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {candidate.userName ?? "Unknown User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {smallAddress(candidate.userKey, 10)}
                        </span>
                      </div>
                      <Link href="/dao-portal">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </ScrollArea>
    </DashboardRedirectCard>
  );
}
