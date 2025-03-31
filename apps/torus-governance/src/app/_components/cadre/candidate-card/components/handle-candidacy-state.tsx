"use client";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import type { CandidateCardProps } from "../index";
import { HandlePendingVoteState } from "./handle-pending-vote-state";
import { HandleRemoveDaoMember } from "./remove-dao-member";

interface HandleCandidacyStateProps {
  candidate: CandidateCardProps["candidate"];
  accept: number;
  refuse: number;
  revoke: number;
}

export function HandleCandidacyState(props: HandleCandidacyStateProps) {
  const { selectedAccount } = useGovernance();
  const cadreList = api.cadre.all.useQuery();

  const isUserCadre = !!cadreList.data?.find(
    (cadre) => cadre.userKey === selectedAccount?.address,
  );

  if (props.candidate.candidacyStatus === "REMOVED") {
    return <div>This member was removed.</div>;
  }

  if (props.candidate.candidacyStatus === "REJECTED") {
    return <div>This candidate was rejected.</div>;
  }

  if (props.candidate.candidacyStatus === "PENDING") {
    return (
      <HandlePendingVoteState
        userKey={props.candidate.userKey}
        selectedAccount={selectedAccount}
        isUserCadre={isUserCadre}
        accept={props.accept}
        refuse={props.refuse}
      />
    );
  }

  return (
    <HandleRemoveDaoMember
      userKey={props.candidate.userKey}
      selectedAccount={selectedAccount}
      isUserCadre={isUserCadre}
      revoke={props.revoke}
    />
  );
}
