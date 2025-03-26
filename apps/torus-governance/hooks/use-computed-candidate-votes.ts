import { api } from "~/trpc/react";
import type { CuratorVoteHistory } from "../src/app/_components/cadre/candidate-card/index";

export interface ComputedVotes {
  accept: number;
  refuse: number;
  revoke: number;
}

interface ComputedVotesProps {
  candidacyStatus: string;
  userKey: string;
  curatorVoteHistory: CuratorVoteHistory | undefined;
}

export function useComputedCandidateVotes(
  props: ComputedVotesProps,
): ComputedVotes {
  const { data: curatorVotes } = api.cadreVote.byId.useQuery({
    applicantKey: props.userKey,
  });

  // Votes for candidacy
  if (props.candidacyStatus === "PENDING") {
    const votes = curatorVotes ?? [];
    return {
      accept: votes.filter((v) => v.vote === "ACCEPT").length,
      refuse: votes.filter((v) => v.vote === "REFUSE").length,
      revoke: 0,
    };
  }
  // Here are the votes to remove the user from the DAO
  // The value that must be considered if you want to check for the "remove from dao" votes is the "revoke" value
  if (props.candidacyStatus === "ACCEPTED") {
    const votes =
      props.curatorVoteHistory?.filter(
        (v) => v.applicantKey === props.userKey,
      ) ?? [];

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
