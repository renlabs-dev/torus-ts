"use client";

import { useState } from "react";
import { TicketX } from "lucide-react";
import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/query-provider/use-toast";
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  TransactionStatus,
} from "@torus-ts/ui";

import type { VoteStatus } from "../vote-label";
import { useGovernance } from "~/context/governance-provider";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";
import { VotePowerSettings } from "./vote-power-settings";

const voteOptions: Omit<VoteStatus[], "UNVOTED"> = ["FAVORABLE", "AGAINST"];

const CardBarebones = (props: { children: JSX.Element }): JSX.Element => {
  return (
    <div className="hidden animate-fade-down animate-delay-500 md:block">
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
        variant="outline"
        className="flex w-full items-center justify-between text-nowrap px-4 py-2.5 text-center font-semibold text-white transition duration-200"
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
  isAccountConnected: boolean;
  isPowerUser: boolean;
  handleVote: () => void;
  setVote: (vote: VoteStatus) => void;
}): JSX.Element => {
  const {
    handleVote,
    setVote,
    vote,
    votingStatus,
    isPowerUser,
    isAccountConnected,
  } = props;

  function handleVotePreference(value: VoteStatus | "") {
    if (value === "" || value === "UNVOTED") return setVote("UNVOTED");
    return setVote(value);
  }

  return (
    <div className="flex w-full flex-col items-end gap-4">
      <div
        className={`relative z-20 flex w-full flex-col items-end gap-2 ${!isAccountConnected && "blur-md"}`}
      >
        {isAccountConnected && <VotePowerSettings isPowerUser={isPowerUser} />}
        <ToggleGroup
          type="single"
          value={vote}
          onValueChange={(voteType: VoteStatus | "") =>
            handleVotePreference(voteType)
          }
          disabled={votingStatus.status === "PENDING" || !isPowerUser}
          className="flex w-full gap-2"
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
          variant="outline"
          className={`w-full ${vote === "UNVOTED" || votingStatus.status === "PENDING" ? "cursor-not-allowed text-gray-400" : ""} `}
          disabled={
            vote === "UNVOTED" ||
            votingStatus.status === "PENDING" ||
            !isPowerUser
          }
          onClick={handleVote}
          type="button"
        >
          {vote === "UNVOTED" ? "Choose a vote" : "Send Vote"}
        </Button>

        {votingStatus.status && (
          <TransactionStatus
            status={votingStatus.status}
            message={votingStatus.message}
          />
        )}
      </div>
      {!isAccountConnected && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center">
          <span>Connect your wallet to vote</span>
        </div>
      )}
    </div>
  );
};

export function ProposalVoteCard(props: {
  proposalStatus: ProposalStatus;
  proposalId: number;
  voted: VoteStatus;
}): JSX.Element {
  const { proposalId, voted = "UNVOTED", proposalStatus } = props;
  const {
    isAccountConnected,
    voteProposal,
    removeVoteProposal,
    isAccountPowerUser,
  } = useGovernance();

  const [vote, setVote] = useState<VoteStatus>("UNVOTED");
  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
    console.log(callbackReturn);
    if (callbackReturn.finalized && callbackReturn.status === "SUCCESS") {
      toast.success("This page will reload in 5 seconds");
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  function handleVote(): void {
    const voteBoolean = vote === "FAVORABLE" ? true : false;
    try {
      void voteProposal({
        proposalId,
        vote: voteBoolean,
        callback: handleCallback,
      });
    } catch {
      setVotingStatus({
        status: "ERROR",
        finalized: true,
        message: "Error voting",
      });
    }
  }

  function handleRemoveVote(): void {
    setVotingStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting vote removal",
    });
    try {
      void removeVoteProposal({
        proposalId,
        callback: handleCallback,
      });
    } catch (error) {
      console.error(error);
      setVotingStatus({
        status: "ERROR",
        finalized: true,
        message: "Error removing vote",
      });
    }
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
    Open() {
      return (
        <CardBarebones>
          <VoteCardFunctionsContent
            isAccountConnected={isAccountConnected}
            handleVote={handleVote}
            vote={vote}
            setVote={setVote}
            isPowerUser={isAccountPowerUser}
            votingStatus={votingStatus}
          />
        </CardBarebones>
      );
    },
    Accepted() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="ACCEPTED"
            governanceModel="PROPOSAL"
          />
        </CardBarebones>
      );
    },
    Expired() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="EXPIRED"
            governanceModel="PROPOSAL"
          />
        </CardBarebones>
      );
    },
    Refused() {
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
