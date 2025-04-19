"use client";

import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/react";

interface VoteBarProps {
  label: string;
  votes: number;
  threshold: number;
  width: number;
}

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

  // Calculate the threshold
  const totalCadreMembers = cadreListData.length;
  const threshold = Math.floor(totalCadreMembers / 2) + 1;

  // Calculate widths based on the total possible votes (cadre members)
  const favorableWidth = (favorableVotes / threshold) * 100;
  const againstWidth = (againstVotes / totalCadreMembers) * 100;

const VoteBar = ({ label, votes, threshold, width }: VoteBarProps) => (
  <div className="flex w-full flex-col gap-2">
    <div className="flex w-full items-center justify-between">
      <span className="text-sm text-white">{label}</span>
      <span className="text-muted-foreground text-xs">
        {votes}/{threshold}
      </span>
    </div>
    <div className="bg-primary-foreground border-border relative h-6 w-full overflow-hidden rounded-full border">
      <div
        className="absolute h-full rounded-full bg-white/40"
        style={{ width: `${width}%` }}
      />
    </div>
  </div>
);


return (
  <Card className="animate-fade-down flex w-full flex-col gap-6 p-6">
    <h3 className="font-medium text-white">Vote Progress</h3>
    
    <VoteBar 
      label="Favorable" 
      votes={favorableVotes} 
      threshold={threshold} 
      width={favorableWidth} 
    />
    
    <VoteBar 
      label="Against" 
      votes={againstVotes} 
      threshold={threshold} 
      width={againstWidth} 
    />
  </Card>
);
}
