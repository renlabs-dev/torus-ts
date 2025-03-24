import type { CuratorVoteHistory } from "../index";
import { api } from "~/trpc/react";

export interface ComputedVotes {
  accept: number;
  refuse: number;
  revoke: number;
}

export function computedVotes(
  candidacyStatus: string,
  userKey: string,
  curatorVoteHistory: CuratorVoteHistory | undefined,
): ComputedVotes {
  const { data: curatorVotes } = api.cadreVote.byId.useQuery({
    applicantKey: userKey,
  });

  // Votes for candidacy
  if (candidacyStatus === "PENDING") {
    const votes = curatorVotes ?? [];
    return {
      accept: votes.filter((v) => v.vote === "ACCEPT").length,
      refuse: votes.filter((v) => v.vote === "REFUSE").length,
      revoke: 0,
    };
  }
  // Here are the votes to remove the user from the DAO
  // The value that must be considered if you want to check for the "remove from dao" votes is the "revoke" value
  if (candidacyStatus === "ACCEPTED") {
    const votes =
      curatorVoteHistory?.filter((v) => v.applicantKey === userKey) ?? [];

    return {
      accept: votes.filter((v) => v.vote === "ACCEPT").length,
      refuse: votes.filter((v) => v.vote === "REFUSE").length,
      revoke: curatorVotes?.length ?? 0,
    };
  }

  return {
    accept: 0,
    refuse: 0,
    revoke: 0,
  };
}
