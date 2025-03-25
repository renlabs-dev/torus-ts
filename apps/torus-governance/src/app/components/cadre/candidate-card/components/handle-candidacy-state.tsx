import type { CandidateCardProps } from "../index";
import { HandlePendingVoteState } from "./handle-pending-vote-state";
import { HandleRemoveDaoMember } from "./remove-dao-member";

interface HandleCandidacyStateProps {
  candidate: CandidateCardProps["candidate"];
  userKey: string;
  accept: number;
  refuse: number;
  revoke: number;
}

export function HandleCandidacyState(
  props: HandleCandidacyStateProps,
): JSX.Element {
  const pendingVoteStateProps = {
    userKey: props.userKey,
    accept: props.accept,
    refuse: props.refuse,
  };

  const removeDaoMemberProps = {
    userKey: props.userKey,
    revoke: props.revoke,
  };

  if (props.candidate.candidacyStatus === "PENDING") {
    return <HandlePendingVoteState {...pendingVoteStateProps} />;
  }
  if (props.candidate.candidacyStatus === "REMOVED") {
    return <div>This member was removed.</div>;
  }
  if (props.candidate.candidacyStatus === "REJECTED") {
    return <div>This candidate was rejected.</div>;
  }
  return <HandleRemoveDaoMember {...removeDaoMemberProps} />;
}
