"use client";

import { useState } from "react";
import { TicketX } from "lucide-react";
import { match } from "rustie";

import type { ProposalStatus, TransactionResult } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  TransactionStatus,
} from "@torus-ts/ui";
import { WalletButton } from "@torus-ts/wallet";

import type { VoteStatus } from "../vote-label";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";

const voteOptions: Omit<VoteStatus[], "UNVOTED"> = ["FAVORABLE", "AGAINST"];

const CardBarebones = (props: { children: JSX.Element }): JSX.Element => {
  return (
    <div className="hidden animate-fade-down border-muted animate-delay-500 md:block">
      <div className="pb-6 pl-0">
        <h3>Cast your vote</h3>
      </div>
      {props.children}
    </div>
  );
};

const AlreadyVotedCardContent = (props: {
  voted: VoteStatus;
  votingStatus: TransactionResult;
  handleRemoveVote: () => void;
}): JSX.Element => {
  const { voted, votingStatus, handleRemoveVote } = props;

  const getVotedText = (voted: VoteStatus): JSX.Element => {
    if (voted === "FAVORABLE") {
      return <span className="text-green-400">You already voted in favor</span>;
    }
    return <span className="text-red-400">You already voted against</span>;
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {getVotedText(voted)}
      <Button
        variant="default"
        className="flex w-full items-center justify-between text-nowrap rounded-lg px-4 py-2.5 text-center font-semibold text-white transition duration-200"
        onClick={handleRemoveVote}
        type="button"
      >
        Remove Vote <TicketX className="h-5 w-5" />
      </Button>
      {votingStatus.status && (
        <TransactionStatus
          status={votingStatus.status}
          message={votingStatus.message}
        />
      )}
    </div>
  );
};

const VoteCardFunctionsContent = (props: {
  vote: VoteStatus;
  votingStatus: TransactionResult;
  isConnected: boolean;
  handleVote: () => void;
  setVote: (vote: VoteStatus) => void;
}): JSX.Element => {
  const { handleVote, setVote, isConnected, vote, votingStatus } = props;

  if (!isConnected) {
    return <WalletButton />;
  }

  function handleVotePreference(value: VoteStatus | "") {
    if (value === "" || value === "UNVOTED") return setVote("UNVOTED");
    return setVote(value);
  }

  return (
    <>
      <ToggleGroup
        type="single"
        value={vote}
        onValueChange={(voteType: VoteStatus | "") =>
          handleVotePreference(voteType)
        }
        className="flex w-full gap-4"
      >
        {voteOptions.map((option) => (
          <ToggleGroupItem
            key={option}
            variant="outline"
            value={option}
            className={`w-full capitalize ${votingStatus.status === "PENDING" && "cursor-not-allowed"} ${option === vote ? "border-white" : "border-muted bg-card"}`}
            disabled={votingStatus.status === "PENDING"}
          >
            {option.toLocaleLowerCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Button
        variant="default"
        className={`mb-1 mt-4 w-full rounded-lg ${vote === "UNVOTED" || votingStatus.status === "PENDING" ? "cursor-not-allowed text-gray-400" : ""} `}
        disabled={vote === "UNVOTED" || votingStatus.status === "PENDING"}
        onClick={handleVote}
        type="button"
      >
        {vote === "UNVOTED" ? "Choose a vote" : "Vote"}
      </Button>

      {votingStatus.status && (
        <TransactionStatus
          status={votingStatus.status}
          message={votingStatus.message}
        />
      )}
    </>
  );
};

export function ProposalVoteCard(props: {
  proposalStatus: ProposalStatus;
  proposalId: number;
  voted: VoteStatus;
}): JSX.Element {
  const { proposalId, voted = "UNVOTED", proposalStatus } = props;
  const { isConnected, voteProposal, removeVoteProposal } = useTorus();

  const [vote, setVote] = useState<VoteStatus>("UNVOTED");
  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
  }

  function handleVote(): void {
    const voteBoolean = vote === "FAVORABLE" ? true : false;
    void voteProposal({
      proposalId,
      vote: voteBoolean,
      callback: handleCallback,
    });
  }

  function handleRemoveVote(): void {
    setVotingStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting vote removal",
    });
    void removeVoteProposal({
      proposalId,
      callback: handleCallback,
    });
  }

  if (voted !== "UNVOTED") {
    return (
      <CardBarebones>
        <AlreadyVotedCardContent
          handleRemoveVote={handleRemoveVote}
          voted={voted}
          votingStatus={votingStatus}
        />
      </CardBarebones>
    );
  }

  return match(proposalStatus)({
    open() {
      return (
        <CardBarebones>
          <VoteCardFunctionsContent
            isConnected={isConnected}
            handleVote={handleVote}
            vote={vote}
            setVote={setVote}
            votingStatus={votingStatus}
          />
        </CardBarebones>
      );
    },
    accepted() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="ACCEPTED"
            governanceModel="PROPOSAL"
          />
        </CardBarebones>
      );
    },
    expired() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="EXPIRED"
            governanceModel="PROPOSAL"
          />
        </CardBarebones>
      );
    },
    refused() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="REFUSED"
            governanceModel="PROPOSAL"
          />
        </CardBarebones>
      );
    },
  });
}
