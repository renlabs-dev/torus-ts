"use client";

import { HandleVoteLabel } from "./handle-vote-label";
import { Button } from "@torus-ts/ui/components/button";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

export function HandlePendingVoteState(
  userKey: string,
  accept: number,
  refuse: number,
): JSX.Element {
  const { selectedAccount } = useGovernance();

  const { data: curatorVotes, refetch: refetchCuratorVotes } =
    api.cadreVote.byId.useQuery({
      applicantKey: userKey,
    });

  const createCadreVote = api.cadreVote.create.useMutation({
    onSuccess: () => refetchCuratorVotes(),
    onError: (error) => {
      console.error("Error submitting data:", error);
    },
  });

  const deleteCadreVote = api.cadreVote.delete.useMutation({
    onSuccess: () => refetchCuratorVotes(),
    onError: (error) => {
      console.error("Error deleting data:", error);
    },
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
      return (
        <div className="flex flex-row flex-wrap gap-4">
          {HandleVoteLabel(vote, accept, refuse)}
          <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
            <Button
              onClick={() => handleRemoveVote()}
              variant="outline"
              className="flex w-full sm:w-auto"
              title="Reject"
            >
              {deleteCadreVote.isPending === true
                ? "Please Sign"
                : "Revoke Vote"}
            </Button>
          </div>
        </div>
      );
    }
  }
  return (
    <div className="flex flex-row flex-wrap gap-4">
      {HandleVoteLabel("", accept, refuse)}
      <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
        <Button
          onClick={() => handleVote("REFUSE")}
          variant="outline"
          className="flex w-full border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500 sm:w-auto"
          title="Reject"
          disabled={createCadreVote.isPending}
        >
          {createCadreVote.isPending &&
          createCadreVote.variables.vote === "REFUSE"
            ? "Please Sign"
            : "Refuse"}
        </Button>
        <Button
          onClick={() => handleVote("ACCEPT")}
          variant="outline"
          className="flex w-full border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-500 sm:w-auto"
          title="Approve"
          disabled={createCadreVote.isPending}
        >
          {createCadreVote.isPending &&
          createCadreVote.variables.vote === "ACCEPT"
            ? "Please Sign"
            : "Accept"}
        </Button>
      </div>
    </div>
  );
}
