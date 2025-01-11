"use client";

import type { inferProcedureOutput } from "@trpc/server";
import { useMemo, useState } from "react";
import { Delete, TicketX } from "lucide-react";

import type { AppRouter } from "@torus-ts/api";
import { toast } from "@torus-ts/toast-provider";
import { Button, Card, ToggleGroup, ToggleGroupItem } from "@torus-ts/ui";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";
import { CreateCadreCandidates } from "./create-cadre-candidates";
import type { AgentApplication } from "@torus-ts/subspace";
import { match } from "rustie";

export type AgentApplicationVoteType = NonNullable<
  inferProcedureOutput<AppRouter["agentApplicationVote"]["byId"]>
>;

type WhitelistVoteType = "ACCEPT" | "REFUSE";

const voteOptions: WhitelistVoteType[] = ["ACCEPT", "REFUSE"];

const CardBarebones = (props: { children: JSX.Element }): JSX.Element => {
  return (
    <div className="animate-fade-down animate-delay-200">
      <div className="pb-6 pl-0">
        <h3 className="text-lg">Cast your vote</h3>
      </div>
      {props.children}
    </div>
  );
};

const AlreadyVotedCardContent = (props: {
  voted: WhitelistVoteType | "REMOVE";
  voteLoading: boolean;
  handleRemoveVote: () => void;
}): JSX.Element => {
  const { voted, handleRemoveVote, voteLoading } = props;

  const getVotedText = (voted: WhitelistVoteType | "REMOVE"): JSX.Element => {
    const voteStatusText: Record<WhitelistVoteType | "REMOVE", JSX.Element> = {
      ACCEPT: (
        <span className="text-green-400">You already voted in favor.</span>
      ),
      REFUSE: <span className="text-red-400">You already voted against.</span>,
      REMOVE: (
        <span className="text-red-400">
          You already voted to remove from whitelist.
        </span>
      ),
    };

    return voteStatusText[voted];
  };

  return (
    <Card className="flex flex-col rounded-md p-4">
      {getVotedText(voted)}
      <Button
        variant="link"
        className="w-fit p-0"
        // className="flex w-fit items-center justify-between text-nowrap px-4 py-2.5 text-center font-semibold text-white transition duration-200"
        onClick={handleRemoveVote}
        type="button"
      >
        {voteLoading ? (
          "Processing..."
        ) : (
          <span className="flex items-center justify-center gap-2">
            <TicketX className="h-5 w-5" />
            Remove Vote
          </span>
        )}
      </Button>
    </Card>
  );
};

const VoteCardFunctionsContent = (props: {
  vote: WhitelistVoteType | "UNVOTED";
  voteLoading: boolean;
  isAccountConnected: boolean;
  isCadreUser: boolean;
  handleVote: () => void;
  setVote: (vote: WhitelistVoteType | "UNVOTED") => void;
}): JSX.Element => {
  const {
    vote,
    voteLoading,
    isAccountConnected,
    isCadreUser,
    handleVote,
    setVote,
  } = props;

  function handleVotePreference(value: WhitelistVoteType | "") {
    if (value === "") return setVote("UNVOTED");
    return setVote(value);
  }

  return (
    <div className="flex w-full flex-col items-end gap-4">
      <div
        className={`relative z-20 flex w-full flex-col items-start gap-2 ${
          (!isAccountConnected || !isCadreUser) && "blur-md"
        }`}
      >
        <ToggleGroup
          type="single"
          value={vote}
          onValueChange={(voteType) =>
            handleVotePreference(voteType as WhitelistVoteType | "")
          }
          disabled={voteLoading || !isCadreUser}
          className="flex w-full gap-2"
        >
          {voteOptions.map((option) => (
            <ToggleGroupItem
              key={option}
              variant="outline"
              value={option}
              className={`w-full capitalize ${
                voteLoading && "cursor-not-allowed"
              } ${option === vote ? "border-white" : "border-muted bg-card"}`}
              disabled={voteLoading}
            >
              {option.toLocaleLowerCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          variant="outline"
          className={`w-full ${
            vote === "UNVOTED" || voteLoading
              ? "cursor-not-allowed text-gray-400"
              : ""
          } `}
          disabled={vote === "UNVOTED" || voteLoading || !isCadreUser}
          onClick={handleVote}
          type="button"
        >
          {vote === "UNVOTED" ? "Choose a vote" : "Send Vote"}
        </Button>
      </div>
      {!isAccountConnected && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center">
          <span>Connect your wallet to vote</span>
        </div>
      )}
      {isAccountConnected && !isCadreUser && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center gap-0.5">
          <span className="mb-4">
            You must be a Curator DAO member to be able to vote on agent/module
            applications and leave comments. Consider applying to become a
            Curator DAO member.
          </span>
          <CreateCadreCandidates />
        </div>
      )}
    </div>
  );
};

export function AgentApplicationVoteTypeCard(props: {
  applicationStatus: AgentApplication["status"];
  applicationId: number;
}) {
  const { applicationId, applicationStatus } = props;
  const { isAccountConnected, selectedAccount } = useGovernance();

  const [vote, setVote] = useState<WhitelistVoteType | "UNVOTED">("UNVOTED");

  const utils = api.useUtils();
  const { data: votes } = api.agentApplicationVote.byApplicationId.useQuery({
    applicationId,
  });
  const { data: cadreUsers } = api.cadre.all.useQuery();

  const userVote = votes?.find((v) => v.userKey === selectedAccount?.address);

  const isCadreUser = useMemo(
    () => cadreUsers?.some((user) => user.userKey === selectedAccount?.address),
    [cadreUsers, selectedAccount],
  );

  const createVoteMutation = api.agentApplicationVote.create.useMutation({
    onSuccess: async () => {
      toast.success("Vote submitted successfully!");
      await utils.agentApplicationVote.byApplicationId.invalidate({
        applicationId,
      });
    },
    onError: (error) => {
      toast.error(`Error submitting vote: ${error.message}`);
    },
  });
  const deleteVoteMutation = api.agentApplicationVote.delete.useMutation({
    onSuccess: async () => {
      toast.success("Vote removed successfully!");
      await utils.agentApplicationVote.byApplicationId.invalidate({
        applicationId,
      });
    },
    onError: (error) => {
      toast.error(`Error removing vote: ${error.message}`);
    },
  });

  const isMutating =
    createVoteMutation.isPending || deleteVoteMutation.isPending;

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

  const handleVoteAction = (voteType: WhitelistVoteType | "REMOVE"): void => {
    if (!ensureConnected() || !ensureIsCadreUser()) return;

    createVoteMutation.mutate({ applicationId, vote: voteType });
  };

  const handleRemoveFromWhitelist = () => {
    handleVoteAction("REMOVE");
  };

  const handleVote = () => {
    if (vote === "UNVOTED") {
      toast.error("Please select a valid vote option.");
      return;
    }
    handleVoteAction(vote);
  };

  const handleRemoveVote = (): void => {
    if (!ensureConnected()) return;

    deleteVoteMutation.mutate({ applicationId });
  };

  return match(applicationStatus)({
    Open() {
      if (userVote) {
        return (
          <CardBarebones>
            <AlreadyVotedCardContent
              handleRemoveVote={handleRemoveVote}
              voted={userVote.vote}
              voteLoading={isMutating}
            />
          </CardBarebones>
        );
      }
      return (
        <CardBarebones>
          <VoteCardFunctionsContent
            isAccountConnected={isAccountConnected}
            handleVote={handleVote}
            voteLoading={isMutating}
            vote={vote}
            setVote={setVote}
            isCadreUser={!!isCadreUser}
          />
        </CardBarebones>
      );
    },
    Resolved({ accepted }) {
      if (accepted) {
        if (userVote && userVote.vote === "REMOVE") {
          return (
            <CardBarebones>
              <AlreadyVotedCardContent
                handleRemoveVote={handleRemoveVote}
                voted={userVote.vote}
                voteLoading={isMutating}
              />
            </CardBarebones>
          );
        } else {
          return (
            <CardBarebones>
              <GovernanceStatusNotOpen
                status="ACCEPTED"
                governanceModel="whitelist application"
              >
                {isAccountConnected && isCadreUser && (
                  <Button
                    // variant={"outline"}
                    variant={"link"}
                    className="w-fit p-0"
                    // className="mt-2 flex w-fit items-center justify-between text-nowrap border border-red-500 bg-amber-600/5 px-4 py-2.5 text-center font-semibold text-red-500 transition duration-200 hover:border-red-400 hover:bg-red-500/15 active:bg-red-500/50"
                    onClick={handleRemoveFromWhitelist}
                    type="button"
                    disabled={isMutating}
                  >
                    {isMutating ? (
                      "Processing..."
                    ) : (
                      <span className="flex items-center justify-center gap-2 text-red-300">
                        <Delete className="h-5 w-5" />
                        Vote to remove from whitelist
                      </span>
                    )}
                  </Button>
                )}
              </GovernanceStatusNotOpen>
            </CardBarebones>
          );
        }
      } else {
        return (
          <CardBarebones>
            <GovernanceStatusNotOpen
              status="REFUSED"
              governanceModel="whitelist application"
            />
          </CardBarebones>
        );
      }
    },
    Expired() {
      return (
        <CardBarebones>
          <GovernanceStatusNotOpen
            status="EXPIRED"
            governanceModel="whitelist application"
          />
        </CardBarebones>
      );
    },
  });
}
