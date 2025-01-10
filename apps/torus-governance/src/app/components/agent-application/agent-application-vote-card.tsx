"use client";

import type { inferProcedureOutput } from "@trpc/server";
import { useMemo, useState } from "react";
import { Delete, TicketX } from "lucide-react";

import type { AppRouter } from "@torus-ts/api";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  TransactionStatus,
} from "@torus-ts/ui";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";

export type AgentApplicationVoteType = NonNullable<
  inferProcedureOutput<AppRouter["agentApplicationVote"]["byId"]>
>;

const voteOptions: AgentApplicationVoteType["vote"][] = [
  "ACCEPT",
  "REFUSE",
  "REMOVE",
];

const CardBarebones = (props: { children: JSX.Element }): JSX.Element => {
  return (
    <div className="hidden animate-fade-down animate-delay-200 md:block">
      <div className="pb-6 pl-0">
        <h3 className="text-lg">Cast your vote</h3>
      </div>
      {props.children}
    </div>
  );
};

const AlreadyVotedCardContent = (props: {
  voted: Omit<AgentApplicationVoteType["vote"], "REMOVE">;
  votingStatus: TransactionResult["status"];
  handleRemoveVote: () => void;
}): JSX.Element => {
  const { voted, votingStatus, handleRemoveVote } = props;

  const getVotedText = (
    voted: Omit<AgentApplicationVoteType["vote"], "REMOVE">,
  ): JSX.Element => {
    if (voted === "ACCEPT") {
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
      {votingStatus && (
        <TransactionStatus status={votingStatus} message={votingStatus} />
      )}
    </div>
  );
};

const VoteCardFunctionsContent = (props: {
  vote: AgentApplicationVoteType["vote"] | "UNVOTED";
  votingStatus: TransactionResult["status"];
  isAccountConnected: boolean;
  isCadreUser: boolean;
  handleVote: () => void;
  setVote: (vote: AgentApplicationVoteType["vote"] | "UNVOTED") => void;
}): JSX.Element => {
  const {
    handleVote,
    setVote,
    vote,
    votingStatus,
    isCadreUser,
    isAccountConnected,
  } = props;

  function handleVotePreference(value: AgentApplicationVoteType["vote"] | "") {
    if (value === "") return setVote("UNVOTED");
    return setVote(value);
  }

  return (
    <div className="flex w-full flex-col items-end gap-4">
      <div
        className={`relative z-20 flex w-full flex-col items-start gap-2 ${(!isAccountConnected || !isCadreUser) && "blur-md"}`}
      >
        <ToggleGroup
          type="single"
          value={vote}
          onValueChange={(voteType) =>
            handleVotePreference(
              voteType as AgentApplicationVoteType["vote"] | "",
            )
          }
          disabled={votingStatus === "PENDING" || !isCadreUser}
          className="flex w-full gap-2"
        >
          {voteOptions.map((option) => (
            <ToggleGroupItem
              key={option}
              variant="outline"
              value={option}
              className={`w-full capitalize ${votingStatus === "PENDING" && "cursor-not-allowed"} ${option === vote ? "border-white" : "border-muted bg-card"}`}
              disabled={votingStatus === "PENDING"}
            >
              {option.toLocaleLowerCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          variant="outline"
          className={`w-full ${vote === "UNVOTED" || votingStatus === "PENDING" ? "cursor-not-allowed text-gray-400" : ""} `}
          disabled={
            vote === "UNVOTED" || votingStatus === "PENDING" || !isCadreUser
          }
          onClick={handleVote}
          type="button"
        >
          {vote === "UNVOTED" ? "Choose a vote" : "Send Vote"}
        </Button>

        {votingStatus && (
          <TransactionStatus status={votingStatus} message={votingStatus} />
        )}
      </div>
      {!isAccountConnected && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center">
          <span>Connect your wallet to vote</span>
        </div>
      )}
      {isAccountConnected && !isCadreUser && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center">
          <span>
            You must be a Curator DAO member to be able to vote on agent/module applications.
            Consider applying to become a Curator DAO member.
          </span>
        </div>
      )}
    </div>
  );
};

export function AgentApplicationVoteTypeCard(props: {
  applicationStatus: "Pending" | "Accepted" | "Refused" | "Removed";
  applicationId: number;
}) {
  const { applicationId, applicationStatus } = props;
  const { isAccountConnected, selectedAccount } = useGovernance();

  const [vote, setVote] = useState<
    AgentApplicationVoteType["vote"] | "UNVOTED"
  >("UNVOTED");
  const [votingStatus, setVotingStatus] =
    useState<TransactionResult["status"]>(null);

  const utils = api.useUtils();
  const { data: votes } = api.agentApplicationVote.byIdActive.useQuery({
    id: applicationId,
  });
  const { data: cadreUsers } = api.cadre.all.useQuery();

  const userVote = votes?.find(
    (vote) => vote.userKey === selectedAccount?.address,
  );

  const isCadreUser = useMemo(
    () => cadreUsers?.some((user) => user.userKey === selectedAccount?.address),
    [cadreUsers, selectedAccount],
  );

  const createVoteMutation = api.agentApplicationVote.create.useMutation({
    onSuccess: async () => {
      toast.success("Vote submitted successfully!");
      await utils.agentApplicationVote.byId.invalidate({ id: applicationId });
      setVotingStatus("SUCCESS");
    },
    onError: (error) => {
      toast.error(`Error submitting vote: ${error.message}`);
      setVotingStatus("ERROR");
    },
  });

  const deleteVoteMutation = api.agentApplicationVote.delete.useMutation({
    onSuccess: async () => {
      toast.success("Vote removed successfully!");
      await utils.agentApplicationVote.byId.invalidate({ id: applicationId });
      setVotingStatus("SUCCESS");
    },
    onError: (error) => {
      toast.error(`Error removing vote: ${error.message}`);
      setVotingStatus("ERROR");
    },
  });

  const ensureConnected = (): boolean => {
    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet.");
      return false;
    }
    return true;
  };

  const ensureIsCadreUser = (): boolean => {
    if (!isCadreUser) {
      toast.error("Only Curator DAO members can perform this action.");
      return false;
    }
    return true;
  };

  const submitVote = (vote: AgentApplicationVoteType["vote"]): void => {
    if (!ensureConnected() || !ensureIsCadreUser()) return;

    setVotingStatus("PENDING");
    const proceedWithVote = () => {
      createVoteMutation.mutate({ applicationId, vote });
    };

    if (userVote) {
      // Remove existing vote before submitting a new one
      deleteVoteMutation.mutate(
        { applicationId },
        {
          onSuccess: proceedWithVote,
        },
      );
    } else {
      proceedWithVote();
    }
  };

  const handleRemoveFromWhitelist = () => {
    submitVote("REMOVE");
  };

  const handleVote = () => {
    if (vote === "UNVOTED") {
      toast.error("Please select a valid vote option.");
      return;
    }
    submitVote(vote);
  };

  const handleRemoveVote = (): void => {
    if (!ensureConnected()) return;
    setVotingStatus("PENDING");

    deleteVoteMutation.mutate({ applicationId });
  };

  if (
    (userVote && applicationStatus === "Pending") ||
    (applicationStatus === "Accepted" && userVote?.vote === "REMOVE")
  ) {
    return (
      <CardBarebones>
        <AlreadyVotedCardContent
          handleRemoveVote={handleRemoveVote}
          voted={userVote.vote}
          votingStatus={votingStatus}
        />
      </CardBarebones>
    );
  }

  switch (applicationStatus) {
    case "Pending":
      return (
        <CardBarebones>
          <VoteCardFunctionsContent
            isAccountConnected={isAccountConnected}
            handleVote={handleVote}
            votingStatus={votingStatus}
            vote={vote}
            setVote={setVote}
            isCadreUser={!!isCadreUser}
          />
        </CardBarebones>
      );
    case "Accepted":
      return (
        <div>
          <CardBarebones>
            <GovernanceStatusNotOpen
              status="ACCEPTED"
              governanceModel="Agent application"
            />
          </CardBarebones>
          {isAccountConnected && isCadreUser && (
            <Button
              className="mt-6 flex w-full items-center justify-between text-nowrap border border-red-500 bg-amber-600/5 px-4 py-2.5 text-center font-semibold text-red-500 transition duration-200 hover:border-red-400 hover:bg-red-500/15 active:bg-red-500/50"
              onClick={handleRemoveFromWhitelist}
              type="button"
              disabled={
                createVoteMutation.isPending || deleteVoteMutation.isPending
              }
            >
              {createVoteMutation.isPending || deleteVoteMutation.isPending
                ? "Processing..."
                : "Vote to remove from whitelist"}
              <Delete className="h-5 w-5" />
            </Button>
          )}
          {/* TODO: Review logic to connect an account and handle the case when isAccountConnected is false*/}
        </div>
      );
    case "Removed":
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="REMOVED"
            governanceModel="Agent application"
          />
        </CardBarebones>
      );
    case "Refused":
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="REFUSED"
            governanceModel="Agent application"
          />
        </CardBarebones>
      );
  }
}
