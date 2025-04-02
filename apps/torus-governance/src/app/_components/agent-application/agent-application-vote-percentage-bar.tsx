import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { api } from "~/trpc/react";

export const AgentApplicationVotePercentageBar = (props: {
  applicationId: number;
}) => {
  const { applicationId } = props;

  const { data: votesList, isLoading: votesLoading } =
    api.agentApplicationVote.byApplicationId.useQuery({
      applicationId,
    });

  const { data: cadreListData, isLoading: cadreLoading } =
    api.cadre.all.useQuery();

  if (votesLoading || cadreLoading) {
    return (
      <div className="flex w-full animate-pulse justify-between">
        <Skeleton className="w-full !rounded-full py-4" />
      </div>
    );
  }

  if (!votesList || votesList.length === 0) {
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
  const totalCadreMembers = cadreListData?.length ?? 0;
  const threshold = Math.floor(totalCadreMembers / 2 + 1);

  // Calculate widths based on the total possible votes (cadre members)
  // This ensures the bar reflects progress toward the threshold
  const favorableWidth = (favorableVotes / totalCadreMembers) * 100;
  const againstWidth = (againstVotes / totalCadreMembers) * 100;
  const thresholdPercent = (threshold / totalCadreMembers) * 100;

  return (
    <div className="relative w-full">
      <div className="border-border bg-primary-foreground relative h-8 w-full overflow-hidden rounded-full border">
        {/* Favorable votes section */}
        <div
          className="border-border h-full rounded-full rounded-r-none border-r bg-white/30"
          style={{ width: `${favorableWidth}%` }}
        />

        {/* Against votes section - right aligned */}
        <div
          className="border-border absolute right-0 top-0 h-full rounded-full rounded-l-none border-l bg-black/30"
          style={{ width: `${againstWidth}%` }}
        />

        {/* Threshold line */}
        <div
          className="absolute bottom-0 top-0 z-10 w-0.5 bg-green-500"
          style={{ left: `${thresholdPercent}%` }}
        />

        {/* Threshold line */}
        <div
          className="absolute bottom-0 top-0 z-10 w-0.5 bg-red-500"
          style={{ right: `${thresholdPercent}%` }}
        />

        <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
          <div className="flex items-center gap-2 text-xs">
            Favorable{" "}
            <span className="text-muted-foreground">
              {favorableVotes}/{threshold}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            Against{" "}
            <span className="text-muted-foreground">
              {againstVotes}/{threshold}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
