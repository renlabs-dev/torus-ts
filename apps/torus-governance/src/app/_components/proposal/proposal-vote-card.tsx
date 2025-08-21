"use client";

import { useState } from "react";

import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";
import { TicketX } from "lucide-react";
import { match } from "rustie";

import type { ProposalStatus, VoteWithStake } from "@torus-network/sdk/chain";
import { removeVoteProposal, voteProposal } from "@torus-network/sdk/chain";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";

import { useGovernance } from "~/context/governance-provider";
import type { VoteStatus } from "~/utils/types";

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
  handleRemoveVote: () => void;
  isPending: boolean;
  isSigning: boolean;
}) => {
  const { voted, handleRemoveVote, isPending, isSigning } = props;

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
        disabled={isPending || isSigning}
      >
        {isPending ? "Removing..." : "Remove Vote"}{" "}
        <TicketX className="h-5 w-5" />
      </Button>
    </div>
  );
};

const VoteCardFunctionsContent = (props: {
  vote: VoteStatus;
  isAccountConnected: boolean;
  isPowerUser: boolean;
  handleVote: () => void;
  setVote: (vote: VoteStatus) => void;
  isPending: boolean;
  isSigning: boolean;
}) => {
  const {
    handleVote,
    setVote,
    vote,
    isPowerUser,
    isAccountConnected,
    isPending,
    isSigning,
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
          disabled={isPending || isSigning || !isPowerUser}
          className="flex w-full gap-2"
        >
          {voteOptions.map((option) => (
            <ToggleGroupItem
              key={option}
              variant="outline"
              value={option}
              className={`w-full capitalize ${isPending ? "cursor-not-allowed" : ""}
              ${option === vote ? "border-white" : "border-muted bg-card"}`}
              disabled={isPending || isSigning}
            >
              {option.toLocaleLowerCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          variant="outline"
          className={`w-full
            ${vote === "UNVOTED" || isPending ? "cursor-not-allowed text-gray-400" : ""} `}
          disabled={vote === "UNVOTED" || isPending || isSigning || !isPowerUser}
          onClick={handleVote}
          type="button"
        >
          {vote === "UNVOTED"
            ? "Choose a vote"
            : isPending
              ? "Voting..."
              : "Send Vote"}
        </Button>

        {isAccountConnected && <VotePowerSettings />}
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
  const { isAccountConnected, isAccountPowerUser, proposals } = useGovernance();

  const { api, selectedAccount, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Vote on Proposal",
  });

  const [vote, setVote] = useState<VoteStatus>("UNVOTED");

  const refetchHandler = async () => {
    await Promise.all([proposals.refetch(), votersListRefetch()]);
  };

  async function handleVote(): Promise<void> {
    if (!api || !sendTx) return;

    const voteBoolean = vote === "FAVORABLE";

    const [sendErr, sendRes] = await sendTx(
      voteProposal(api, proposalId, voteBoolean),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      void refetchHandler();
    });
  }

  async function handleRemoveVote(): Promise<void> {
    if (!api || !sendTx) return;

    const [sendErr, sendRes] = await sendTx(
      removeVoteProposal(api, proposalId),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      void refetchHandler();
    });
  }

  if (voted !== "UNVOTED") {
    return (
      <CardBarebones>
        <AlreadyVotedCardContent
          handleRemoveVote={handleRemoveVote}
          voted={voted}
          isPending={isPending}
          isSigning={isSigning}
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
            isPending={isPending}
            isSigning={isSigning}
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
