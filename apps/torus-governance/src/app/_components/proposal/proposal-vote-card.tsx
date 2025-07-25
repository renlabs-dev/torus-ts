"use client";

import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";
import type { ProposalStatus, VoteWithStake } from "@torus-network/sdk/chain";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useGovernance } from "~/context/governance-provider";
import type { VoteStatus } from "~/utils/types";
import { TicketX } from "lucide-react";
import { useState } from "react";
import { match } from "rustie";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";
import { VotePowerSettings } from "./vote-power-settings";

const voteOptions: Omit<VoteStatus[], "UNVOTED"> = ["FAVORABLE", "AGAINST"];

const CardBarebones = (props: { children: React.ReactNode }) => {
  return (
    <div className="animate-fade-down animate-delay-700 hidden md:block">
      <h3 className="mb-4 text-lg">Cast your vote</h3>
      {props.children}
    </div>
  );
};

const AlreadyVotedCardContent = (props: {
  voted: VoteStatus;
  votingStatus: TransactionResult;
  handleRemoveVote: () => void;
}) => {
  const { voted, votingStatus, handleRemoveVote } = props;

  const getVotedText = (voted: VoteStatus) => {
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
        className="flex w-full items-center justify-between text-nowrap px-4 py-2.5 text-center
          font-semibold text-white transition duration-200"
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
}) => {
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
      <div className={"z-20 flex w-full flex-col items-start gap-2"}>
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
              className={`w-full capitalize ${votingStatus.status === "PENDING" && "cursor-not-allowed"}
              ${option === vote ? "border-white" : "border-muted bg-card"}`}
              disabled={votingStatus.status === "PENDING"}
            >
              {option.toLocaleLowerCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          variant="outline"
          className={`w-full
            ${vote === "UNVOTED" || votingStatus.status === "PENDING" ? "cursor-not-allowed text-gray-400" : ""} `}
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

        {isAccountConnected && <VotePowerSettings />}

        {votingStatus.status && (
          <TransactionStatus
            status={votingStatus.status}
            message={votingStatus.message}
          />
        )}
      </div>
      {!isAccountConnected && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center text-lg">
          <span>Connect your wallet to vote</span>
        </div>
      )}
      {!isAccountConnected && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-80"></div>
      )}
    </div>
  );
};

interface ProposalVoteCardProps {
  proposalStatus: ProposalStatus;
  proposalId: number;
  voted: VoteStatus;
  votersListRefetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<VoteWithStake[], Error>>;
}

export function ProposalVoteCard(props: Readonly<ProposalVoteCardProps>) {
  const {
    proposalId,
    voted = "UNVOTED",
    proposalStatus,
    votersListRefetch,
  } = props;
  const {
    isAccountConnected,
    isAccountPowerUser,
    proposals,
    removeVoteProposal,
    voteProposal,
  } = useGovernance();

  const [vote, setVote] = useState<VoteStatus>("UNVOTED");
  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  const refetchHandler = async () => {
    await Promise.all([proposals.refetch(), votersListRefetch()]);
  };

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
  }

  async function handleVote(): Promise<void> {
    const voteBoolean = vote === "FAVORABLE";

    const [error, _] = await tryAsync(
      voteProposal({
        proposalId,
        vote: voteBoolean,
        callback: handleCallback,
        refetchHandler,
      }),
    );

    if (error !== undefined) {
      setVotingStatus({
        status: "ERROR",
        finalized: true,
        message: "Error voting",
      });
    }
  }

  async function handleRemoveVote(): Promise<void> {
    setVotingStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting vote removal",
    });

    const [error, _] = await tryAsync(
      removeVoteProposal({
        proposalId,
        callback: handleCallback,
        refetchHandler,
      }),
    );

    if (error !== undefined) {
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
