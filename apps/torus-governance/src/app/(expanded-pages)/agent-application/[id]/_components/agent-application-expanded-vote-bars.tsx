"use client";

import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/react";

export function AgentApplicationExpandedVoteBars({ id }: { id: number }) {
  const { data: votesList, isLoading: votesLoading } =
    api.agentApplicationVote.byApplicationId.useQuery({
      applicationId: id,
    });

  const { data: cadreListData, isLoading: cadreLoading } =
    api.cadre.all.useQuery();

  if (votesLoading || cadreLoading || !votesList || !cadreListData) {
    return null;
  }

  const favorableVotes = votesList.filter(
    (vote) => vote.vote === "ACCEPT",
  ).length;
  const againstVotes = votesList.filter(
    (vote) => vote.vote === "REFUSE" || vote.vote === "REMOVE",
  ).length;
  const totalVotes = favorableVotes + againstVotes;

  if (totalVotes === 0) {
    return null;
  }

  // Calculate the threshold
  const totalCadreMembers = cadreListData.length;
  const threshold = Math.floor(totalCadreMembers / 2) + 1;

  // Calculate widths based on the total possible votes (cadre members)
  const favorableWidth = (favorableVotes / threshold) * 100;
  const againstWidth = (againstVotes / totalCadreMembers) * 100;

  return (
    <Card className="animate-fade-down animate-delay-[1400ms] flex w-full flex-col gap-6 p-6">
      <h3 className="font-medium text-white">Vote Progress</h3>

      {/* Favorable Votes Bar */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-white">Favorable</span>
          <span className="text-muted-foreground text-xs">
            {favorableVotes}/{threshold}
          </span>
        </div>
        <div className="bg-primary-foreground border-border relative h-6 w-full overflow-hidden rounded-full border">
          <div
            className="absolute h-full rounded-full bg-white/40"
            style={{ width: `${favorableWidth}%` }}
          />
        </div>
      </div>

      {/* Against Votes Bar */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-white">Against</span>
          <span className="text-muted-foreground text-xs">
            {againstVotes}/{threshold}
          </span>
        </div>
        <div className="bg-primary-foreground border-border relative h-6 w-full overflow-hidden rounded-full border">
          <div
            className="absolute h-full rounded-full bg-white/40"
            style={{ width: `${againstWidth}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
