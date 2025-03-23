"use client";

import { handleInFavorAgainstText } from "./handle-infavor-against-text";
import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

export function handleVoteState(
  userKey: string,
  accept: number,
  refuse: number,
): JSX.Element {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { selectedAccount } = useGovernance();

  const { data: curatorVotes, refetch: refetchCuratorVotes } =
    api.cadreVote.byId.useQuery({
      applicantKey: userKey,
    });

  const createCadreVote = api.cadreVote.create.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const deleteCadreVote = api.cadreVote.delete.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const currentWalletVote = curatorVotes?.find(
    (vote) => vote.userKey === selectedAccount?.address,
  );

  const handleVote = async (vote: "ACCEPT" | "REFUSE" | "REMOVE") => {
    await createCadreVote.mutateAsync({
      vote,
      applicantKey: userKey,
    });
  };

  const handleRemoveVote = async () => {
    await deleteCadreVote.mutateAsync({
      applicantKey: userKey,
    });
  };

  if (currentWalletVote?.applicantKey === userKey) {
    const vote = currentWalletVote.vote;
    if (vote === "ACCEPT" || vote === "REFUSE") {
      const revokeVoteButton = (
        <div className="flex flex-row flex-wrap gap-4">
          {handleInFavorAgainstText(vote, accept, refuse)}
          <Label className="flex items-center justify-center gap-2 text-xs">
            <Button
              onClick={() => handleRemoveVote()}
              variant="outline"
              title="Reject"
            >
              Revoke Vote
            </Button>
          </Label>
        </div>
      );
      return revokeVoteButton;
    }
  }
  const toVoteButton = (
    <div className="flex flex-row flex-wrap gap-4">
      {handleInFavorAgainstText("", accept, refuse)}
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={() => handleVote("REFUSE")}
          variant="outline"
          className="border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500"
          title="Reject"
        >
          Refuse
        </Button>
        <Button
          onClick={() => handleVote("ACCEPT")}
          variant="outline"
          className="border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-500"
          title="Approve"
        >
          Accept
        </Button>
      </div>
    </div>
  );
  return toVoteButton;
}
