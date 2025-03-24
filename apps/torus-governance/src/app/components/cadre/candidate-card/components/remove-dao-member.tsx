"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import React from "react";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

export function HandleRemoveDaoMember(
  userKey: string,
  revoke: number,
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

  const handleVote = async (vote: "REMOVE") => {
    await createCadreVote.mutateAsync({
      vote,
      applicantKey: userKey,
    });
  };

  async function handleRemoveVote() {
    await deleteCadreVote.mutateAsync({ applicantKey: userKey });
  }

  const voteCount = (
    <>
      Remove vote count: <span className="text-red-500">{revoke}</span>
    </>
  );

  // User has already voted to remove
  if (currentWalletVote?.vote === "REMOVE") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
          <span className="text-red-500">(You voted to remove)</span>
          {voteCount}
        </Label>
        <Button
          variant="outline"
          onClick={() => handleRemoveVote()}
          type="button"
          className="flex w-full sm:w-auto"
          disabled={createCadreVote.isPending}
        >
          {createCadreVote.isPending ? "Awaiting Signature" : "Remove Vote"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Label className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
        {voteCount}
      </Label>
      <Button
        onClick={() => handleVote("REMOVE")}
        variant="destructive"
        className="flex w-full sm:w-auto"
        disabled={createCadreVote.isPending}
      >
        {createCadreVote.isPending ? "Awaiting Signature" : "Remove Member"}
      </Button>
    </div>
  );
}
