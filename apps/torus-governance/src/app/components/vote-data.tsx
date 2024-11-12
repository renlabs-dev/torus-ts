import type { ProposalStatus } from "@torus-ts/types";
import { Card, CardHeader } from "@torus-ts/ui/components";
import { handleProposalVotesInFavor, handleProposalVotesAgainst, calcProposalFavorablePercent } from "~/utils";

interface VoteDataProps {
  proposalStatus: ProposalStatus,
}

export const VoteData = (
  props: VoteDataProps
) => {
  const { proposalStatus } = props
  const favorablePercent = calcProposalFavorablePercent(proposalStatus);

  if (favorablePercent === null) {
    return (
      <Card className="p-6 animate-fade-down animate-delay-500">
        <CardHeader className="pt-0 pl-0">
          <h3>Voting</h3>
        </CardHeader>
        <p className="text-muted-foreground">This proposal has no votes yet or is closed.</p>
      </Card>
    );
  }

  const againstPercent = 100 - favorablePercent;
  return (
    <Card className="p-6 border-muted animate-fade-down animate-delay-500">
      <CardHeader className="pt-0 pl-0">
        <h3>Voting</h3>
      </CardHeader>
      <div className="flex justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Favorable</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesInFavor(proposalStatus)}
            <span className="text-muted-foreground"> TOR</span>
          </span>
          <span className="pl-2 text-sm font-semibold text-muted-foreground">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="w-full my-2 rounded-lg bg-accent">
        <div
          className="py-2 rounded-lg bg-muted"
          style={{
            width: `${favorablePercent.toFixed(0)}%`,
          }}
        />
      </div>
      <div className="flex justify-between mt-6">
        <span className="font-semibold text-muted-foreground">Against</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesAgainst(proposalStatus)}
            <span className="text-muted-foreground"> TOR</span>
          </span>
          <span className="pl-2 text-sm font-semibold text-muted-foreground">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="w-full my-2 rounded-lg bg-accent">
        <div
          className="py-2 rounded-lg bg-muted"
          style={{
            width: `${againstPercent.toFixed(0)}%`,
          }}
        />
      </div>
    </Card>
  );
}