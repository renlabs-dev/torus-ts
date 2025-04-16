// apps/torus-governance/src/hooks/use-vote-management.ts
"use client";

import { api } from "~/trpc/react";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { toast } from "@torus-ts/ui/hooks/use-toast";
import { BasicLogger } from "@torus-network/torus-utils/logger";

export type VoteType = "ACCEPT" | "REFUSE" | "REMOVE";

const log = BasicLogger.create({ name: "vote-management-hook" });

export function useVoteManagement(
  userKey: string,
  selectedAccountAddress?: string,
) {
  // Get existing votes
  const { data: curatorVotes, refetch: refetchCuratorVotes } =
    api.cadreVote.byId.useQuery({
      applicantKey: userKey,
    });

  const createCadreVote = api.cadreVote.create.useMutation();
  const deleteCadreVote = api.cadreVote.delete.useMutation();

  // Find the current vote by the selected account
  const currentWalletVote = selectedAccountAddress
    ? curatorVotes?.find((vote) => vote.userKey === selectedAccountAddress)
    : undefined;

  // Handler for creating a vote
  async function handleVote(vote: VoteType) {
    const createVoteRes = await tryAsync(
      createCadreVote.mutateAsync({
        vote,
        applicantKey: userKey,
      }),
    );

    if (log.ifResultIsErr(createVoteRes)) {
      toast.error("Failed to submit your vote. Please try again.");
      console.error("Error submitting data:", createVoteRes[0].message);
      return false;
    }

    toast.success("Vote submitted successfully!");
    void refetchCuratorVotes();
    return true;
  }

  // Handler for removing a vote
  async function handleRemoveVote() {
    const deleteVoteRes = await tryAsync(
      deleteCadreVote.mutateAsync({
        applicantKey: userKey,
      }),
    );

    if (log.ifResultIsErr(deleteVoteRes)) {
      toast.error("Failed to revoke your vote. Please try again.");
      console.error("Error revoking vote:", deleteVoteRes[0].message);
      return false;
    }

    toast.success("Vote revoked successfully!");
    void refetchCuratorVotes();
    return true;
  }

  return {
    currentVote: currentWalletVote?.vote,
    isPending: createCadreVote.isPending || deleteCadreVote.isPending,
    pendingAction: createCadreVote.isPending
      ? createCadreVote.variables.vote
      : undefined,
    handleVote,
    handleRemoveVote,
  };
}
