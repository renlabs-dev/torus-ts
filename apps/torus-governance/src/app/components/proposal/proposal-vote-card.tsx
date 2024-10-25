"use client";

import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { ReceiptRefundIcon } from "@heroicons/react/24/outline";
import { match } from "rustie";

import type { ProposalStatus, TransactionResult } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { TransactionStatus } from "@torus-ts/ui";
import { WalletButton } from "@torus-ts/wallet";

import type { VoteStatus } from "../vote-label";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";
import { SectionHeaderText } from "../section-header-text";

export function ProposalVoteCard(props: {
  proposalStatus: ProposalStatus;
  proposalId: number;
  voted: VoteStatus;
}): JSX.Element {
  const { proposalId, voted = "UNVOTED", proposalStatus } = props;
  const { isConnected, voteProposal, removeVoteProposal } = useTorus();

  const [vote, setVote] = useState("UNVOTED");
  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleVotePreference(value: VoteStatus): void {
    if (vote === "UNVOTED" || vote !== value) {
      setVote(value);
      return;
    }
    if (vote === value) {
      setVote("UNVOTED");
    }
  }

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
      <>
        <SectionHeaderText text="Cast your vote" />
        <div className="flex w-full flex-col gap-2">
          <span>
            You already voted{" "}
            {voted === "FAVORABLE" ? (
              <b className="text-green-500">in favor</b>
            ) : (
              <b className="text-red-500">against</b>
            )}
          </span>
          <button
            className="flex w-full items-center justify-between text-nowrap border border-amber-500 bg-amber-600/5 px-4 py-2.5 text-center font-semibold text-amber-500 transition duration-200 hover:border-amber-400 hover:bg-amber-500/15 active:bg-amber-500/50"
            onClick={handleRemoveVote}
            type="button"
          >
            Remove Vote <ReceiptRefundIcon className="h-5 w-5" />
          </button>
          {votingStatus.status && (
            <TransactionStatus
              status={votingStatus.status}
              message={votingStatus.message}
            />
          )}
        </div>
      </>
    );
  }

  return match(proposalStatus)({
    open() {
      return (
        <>
          <SectionHeaderText text="Cast your vote" />
          {isConnected ? (
            <div className="flex w-full gap-4">
              <button
                className={`w-full border border-green-600 py-1 ${vote === "FAVORABLE" ? "border-green-500 bg-green-500/10 text-green-500" : "text-green-600"} ${votingStatus.status === "PENDING" && "cursor-not-allowed"}`}
                disabled={votingStatus.status === "PENDING"}
                onClick={() => {
                  handleVotePreference("FAVORABLE");
                }}
                type="button"
              >
                Favorable
              </button>
              <button
                className={`w-full border border-red-600 py-1 ${vote === "AGAINST" ? "border-red-500 bg-red-500/10 text-red-500" : "text-red-500"} ${votingStatus.status === "PENDING" && "cursor-not-allowed"}`}
                disabled={votingStatus.status === "PENDING"}
                onClick={() => {
                  handleVotePreference("AGAINST");
                }}
                type="button"
              >
                Against
              </button>
            </div>
          ) : null}

          {!isConnected && <WalletButton />}

          {isConnected ? (
            <button
              className={`mt-4 w-full border p-1.5 ${vote === "UNVOTED" || votingStatus.status === "PENDING" ? "cursor-not-allowed border-gray-400 text-gray-400" : "border-blue-400 bg-blue-500/10 text-blue-400"} `}
              disabled={vote === "UNVOTED" || votingStatus.status === "PENDING"}
              onClick={handleVote}
              type="button"
            >
              {vote === "UNVOTED" && "Choose Before Voting"}
              {vote !== "UNVOTED" && "Vote"}
            </button>
          ) : null}

          {votingStatus.status ? (
            <p
              className={`${votingStatus.status === "PENDING" && "text-yellow-300"} ${votingStatus.status === "ERROR" && "text-red-300"} ${votingStatus.status === "SUCCESS" && "text-green-300"} flex text-left text-base`}
            >
              {votingStatus.message}
              {votingStatus.status === "PENDING" && (
                <ArrowPathIcon className="ml-2 animate-spin" width={16} />
              )}
            </p>
          ) : null}
        </>
      );
    },
    accepted() {
      return (
        <GovernanceStatusNotOpen
          statusText="Accepted"
          governanceModel="PROPOSAL"
        />
      );
    },
    expired() {
      return (
        <GovernanceStatusNotOpen
          statusText="Expired"
          governanceModel="PROPOSAL"
        />
      );
    },
    refused() {
      return (
        <GovernanceStatusNotOpen
          statusText="Refused"
          governanceModel="PROPOSAL"
        />
      );
    },
  });
}
