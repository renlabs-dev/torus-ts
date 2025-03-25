"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import React from "react";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

interface HandleRemoveDaoMemberProps {
  userKey: string;
  revoke: number;
}

export function HandleRemoveDaoMember(props: HandleRemoveDaoMemberProps) {
  const { selectedAccount } = useGovernance();

  const { data: curatorVotes, refetch: refetchCuratorVotes } =
    api.cadreVote.byId.useQuery({
      applicantKey: props.userKey,
    });

  const handleVote = async (vote: "REMOVE") => {
    await createCadreVote.mutateAsync({
      vote,
      applicantKey: props.userKey,
    });
  };

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

  async function handleRemoveVote() {
    await deleteCadreVote.mutateAsync({ applicantKey: props.userKey });
  }

  const voteCount = (
    <>
      Remove vote count: <span className="text-red-500">{props.revoke}</span>
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
          disabled={deleteCadreVote.isPending}
        >
          {deleteCadreVote.isPending ? "Please Sign" : "Remove Vote"}
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
        {createCadreVote.isPending ? "Please Sign" : "Remove Member"}
      </Button>
    </div>
  );
}
