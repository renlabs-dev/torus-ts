// apps/torus-governance/src/hooks/use-vote-management.ts
"use client";

import { api } from "~/trpc/react";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { toast } from "@torus-ts/ui/hooks/use-toast";
export type VoteType = "ACCEPT" | "REFUSE" | "REMOVE";

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
    const [error, _success] = await tryAsync(
      createCadreVote.mutateAsync({
        vote,
        applicantKey: userKey,
      }),
    );

    if (error !== undefined) {
      toast.error(error.message || "Failed to submit your vote. Please try again.");
      return false;
    }

    toast.success("Vote submitted successfully!");
    
    // Refetch with error handling
    const [refetchError] = await tryAsync(refetchCuratorVotes());
    if (refetchError !== undefined) {
      console.error("Error refreshing votes:", refetchError);
      // Don't show error to user as the vote was successful
    }
    
    return true;
  }

  // Handler for removing a vote
  async function handleRemoveVote() {
    const [error, _success] = await tryAsync(
      deleteCadreVote.mutateAsync({
        applicantKey: userKey,
      }),
    );

    if (error !== undefined) {
      toast.error(error.message || "Failed to revoke your vote. Please try again.");
      return false;
    }

    toast.success("Vote revoked successfully!");
    
    // Refetch with error handling
    const [refetchError] = await tryAsync(refetchCuratorVotes());
    if (refetchError !== undefined) {
      console.error("Error refreshing votes:", refetchError);
      // Don't show error to user as the vote removal was successful
    }
    
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
