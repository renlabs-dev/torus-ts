"use client";

import type { AgentApplication } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { useState } from "react";
import { match } from "rustie";
import { GovernanceStatusNotOpen } from "../governance-status-not-open";
import { tryAsync } from "@torus-network/torus-utils/try-catch";


type WhitelistVoteType = "ACCEPT" | "REFUSE";

const CardBarebones = (props: { children: React.ReactNode }) => {
  return (
    <Card className="animate-fade-down animate-delay-[1200ms] p-4 lg:p-6">
      <div className="pb-6 pl-0">
        <p className="font-semibold">Cast your vote</p>
      </div>
      {props.children}
    </Card>
  );
};

const AlreadyVotedCardContent = (props: {
  voted: WhitelistVoteType | "REMOVE";
  voteLoading: boolean;
  handleRemoveVote: () => void;
}) => {
  const { voted, handleRemoveVote, voteLoading } = props;

  const getVotedText = (voted: WhitelistVoteType | "REMOVE") => {
    const voteStatusText: Record<
      WhitelistVoteType | "REMOVE",
      React.ReactNode
    > = {
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
    <Card className="gap-6 rounded-radius flex flex-col p-6">
      {getVotedText(voted)}
      <Button
        variant="outline"
        onClick={handleRemoveVote}
        type="button"
      >
        {voteLoading ? (
          "Awaiting Signature..."
        ) : "Remove Vote" }
      </Button>
    </Card>
  );
};

const VoteCardFunctionsContent = (props: {
  vote: WhitelistVoteType | "UNVOTED";
  voteLoading: boolean;
  isAccountConnected: boolean;
  isUserCadre: boolean;
  handleVote: () => void;
  setVote: (vote: WhitelistVoteType | "UNVOTED") => void;
}) => {
  const {
    vote,
    voteLoading,
    isAccountConnected,
    isUserCadre,
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
          (!isAccountConnected || !isUserCadre) && "opacity-30"
        }`}
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={vote}
          onValueChange={(voteType) =>
            handleVotePreference(voteType as WhitelistVoteType | "")
          }
          disabled={voteLoading || !isUserCadre}
          className="flex w-full gap-2"
        >
          <ToggleGroupItem
            value={"ACCEPT"}
            className={`w-full text-green-500 data-[state=on]:text-green-500 ${
              voteLoading && "cursor-not-allowed"
            } `}
            disabled={voteLoading}
          >
            Accept
          </ToggleGroupItem>
          <ToggleGroupItem
            variant="outline"
            value={"REFUSE"}
            className={`w-full text-red-500 data-[state=on]:text-red-500 ${
              voteLoading && "cursor-not-allowed"
            } `}
            disabled={voteLoading}
          >
            Refuse
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="outline"
          className={`w-full ${
            vote === "UNVOTED" || voteLoading
              ? "cursor-not-allowed text-gray-400"
              : ""
          } `}
          disabled={vote === "UNVOTED" || voteLoading || !isUserCadre}
          onClick={handleVote}
          type="button"
        >
          {vote === "UNVOTED" ? "Choose a vote" : `Send Vote:  ${vote.charAt(0)}${vote.slice(1).toLowerCase()}`}
        </Button>
      </div>
      {!isAccountConnected && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center pt-12 text-sm">
          <span>Are you a Curator DAO member?</span>
          <span>Please connect your wallet to vote</span>
        </div>
      )}
      {isAccountConnected && !isUserCadre && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center gap-0.5 px-6 pt-6">
          <span className="my-4">
            You must be a Curator DAO member to be able to vote on agent
            applications.
          </span>
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

  const cadreList = api.cadre.all.useQuery();

  const isUserCadre = !!cadreList.data?.find(
    (cadre) => cadre.userKey === selectedAccount?.address,
  );

  const [vote, setVote] = useState<WhitelistVoteType | "UNVOTED">("UNVOTED");

  const utils = api.useUtils();
  const { data: votes } = api.agentApplicationVote.byApplicationId.useQuery({
    applicationId,
  });

  const { toast } = useToast();

  const userVote = votes?.find((v) => v.userKey === selectedAccount?.address);

  //create vote mutation
  const createApplicationVoteMutation = api.agentApplicationVote.create.useMutation();

  //delete vote mutation
  const deleteApplicationVoteMutation = api.agentApplicationVote.delete.useMutation();

  // that's not the greatest, but, I am just removing some sutff
  const userAddress = selectedAccount?.address
  // =============================
  // Legacy code -- Never remove this
  // NEVER
    // const ensureConnected = (): boolean => {
    //   if (!selectedAccount?.address) {
    //     toast.error("Please connect your wallet.")
    //     return false;
    //   }
    //   return true;
    // };
    //  const ensureisUserCadre = (): boolean => {
    //     if (!isUserCadre) {
    //       return false;
    //     }
    //     return true;
    //   };
  // =============================


  async function handleApplicationCreateVoteMutation(applicationId: number, voteType: WhitelistVoteType | "REMOVE") {
    if (!isUserCadre || !userAddress) return;

    const [error, _result] = await tryAsync(
      createApplicationVoteMutation.mutateAsync({
        applicationId,
        vote: voteType
      })
    )
    if (error !== undefined){ 
      toast.error(`Error submitting vote: ${error.message}`)
      return;
    }
    const [invalidateError, _invalidateResult] = await tryAsync(
      Promise.all([
        utils.agentApplicationVote.byApplicationId.invalidate({
          applicationId,
        }),
        utils.agentApplicationVote.byUserKey.invalidate({
          userKey: userAddress,
        }),
      ])
    );
    if (invalidateError !== undefined) {
        console.error("Error refreshing data:", invalidateError);
        return;
    }
    toast.success("Vote submitted successfully!")
  }



  async function handleApplicationDeleteVoteMutation(applicationId: number) {
    if (!isUserCadre || !userAddress) return;
    const [error, _success] = await tryAsync(deleteApplicationVoteMutation.mutateAsync({
        applicationId,
      }))
    if (error !== undefined){
      toast.error(`Error removing vote: ${error.message}`);
      return;
      }
    const [invalidateError, _invalidateResult] = await tryAsync(
      Promise.all([
      utils.agentApplicationVote.byApplicationId.invalidate({
        applicationId,
      }),
      utils.agentApplicationVote.byUserKey.invalidate({
        userKey: userAddress,
      }),
      ])
    );
    if (invalidateError !== undefined) {
      toast.error(`Error removing vote: ${invalidateError.message}`)
      return;
    }
    toast.success("Vote removed successfully!")
  }

    
    const isMutating =
    createApplicationVoteMutation.isPending || deleteApplicationVoteMutation.isPending;


    const handleVoteAction = (voteType: WhitelistVoteType | "REMOVE"): void => {
      if (!isUserCadre || !userAddress) return;

    void handleApplicationCreateVoteMutation(applicationId, voteType);
    };

    const handleRemoveFromWhitelist = () => {
      handleVoteAction("REMOVE");
    };

    const handleVote = () => {
      if (vote === "UNVOTED") {
        toast.error("Please select a valid vote option.")
        return;
      }
      handleVoteAction(vote);
    };

    const handleRemoveVote = (): void => {
      if (!selectedAccount?.address) {
        toast.error("Please connect your wallet")
        return;
      }

      void handleApplicationDeleteVoteMutation( applicationId );
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
              isUserCadre={!!isUserCadre}
            />
          </CardBarebones>
        );
      },
      Resolved({ accepted }) {
        if (accepted) {
          if (userVote && userVote.vote === "REMOVE") {
            return (
                <AlreadyVotedCardContent
                  handleRemoveVote={handleRemoveVote}
                  voted={userVote.vote}
                  voteLoading={isMutating}
                />
            );
          } else {
            return (
                  <GovernanceStatusNotOpen
                    status="ACCEPTED"
                    governanceModel="whitelist application"
                  >
                    {isAccountConnected && isUserCadre && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveFromWhitelist}
                        type="button"
                        disabled={isMutating}
                        className="md:overflow-hidden flex w-full border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500 "
                      >
                        {isMutating ? "Aawiting Signature" : "Vote to remove from whitelist"}
                      </Button>
                    )}
                  </GovernanceStatusNotOpen>
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
