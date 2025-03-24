import type { CandidateCardProps } from "../index";
import { HandlePendingVoteState } from "./handle-pending-vote-state";
import { HandleRemoveDaoMember } from "./remove-dao-member";

export function handleCandidacyState(
  candidate: CandidateCardProps["candidate"],
  userKey: string,
  accept: number,
  refuse: number,
  revoke: number,
): JSX.Element {
  if (candidate.candidacyStatus === "PENDING") {
    return HandlePendingVoteState(userKey, accept, refuse);
  }
  if (candidate.candidacyStatus === "REMOVED") {
    return <div>This member was removed.</div>;
  }
  if (candidate.candidacyStatus === "REJECTED") {
    return <div>This candidate was rejected.</div>;
  }
  return HandleRemoveDaoMember(userKey, revoke);
}
