"use client";

import type { AppRouter } from "@torus-ts/api";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Icons } from "@torus-ts/ui/components/icons";
import { Label } from "@torus-ts/ui/components/label";
import { Separator } from "@torus-ts/ui/components/separator";
import { smallAddress } from "@torus-ts/utils/subspace";
import type { inferProcedureOutput } from "@trpc/server";
import { Crown } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

export type Candidate = NonNullable<
  inferProcedureOutput<AppRouter["cadreCandidate"]["allWithDiscord"]>
>[number];

interface CandidateCardProps {
  candidate: Candidate;
}

export function ToVoteCandidateCard({ candidate }: CandidateCardProps) {
  const { selectedAccount } = useGovernance();

  const {
    userName: userNames = "empty",
    avatarUrl,
    discordId: discordIds = "",
    userKey = "",
    createdAt: dateCreated = new Date("01-01-01"),
    content: contentValue = "",
    candidacyStatus = "REMOVED",
  } = candidate;

  const { data: curatorVotes, refetch: refetchCuratorVotes } =
    api.cadreVote.byId.useQuery({
      applicantKey: userKey,
    });

  const { data: curatorVoteHistory } = api.cadreVoteHistory.all.useQuery();

  const createCadreVote = api.cadreVote.create.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const deleteCadreVote = api.cadreVote.delete.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const computedVotes = () => {
    if (candidacyStatus === "PENDING") {
      const votes = curatorVotes ?? [];
      return {
        accept: votes.filter((v) => v.vote === "ACCEPT").length,
        refuse: votes.filter((v) => v.vote === "REFUSE").length,
        revoke: 0,
      };
    } else {
      const votes =
        curatorVoteHistory?.filter((v) => v.applicantKey === userKey) ?? [];
      return {
        accept: votes.filter((v) => v.vote === "ACCEPT").length,
        refuse: votes.filter((v) => v.vote === "REFUSE").length,
        revoke: curatorVotes?.length ?? 0,
      };
    }
  };

  const currentWalletVote = curatorVotes?.find(
    (vote) => vote.userKey === selectedAccount?.address,
  );

  const handleVote = async (vote: "ACCEPT" | "REFUSE" | "REMOVE") => {
    await createCadreVote.mutateAsync({
      vote,
      applicantKey: userKey,
    });
  };

  const handleRemoveVote = async () => {
    await deleteCadreVote.mutateAsync({
      applicantKey: userKey,
    });
  };

  const { accept, refuse } = computedVotes();

  function handleInFavorAgainstText(vote: string): JSX.Element {
    const votedText =
      vote === "ACCEPT" ? (
        <>
          (You voted&nbsp;
          <span className="text-green-500">In&nbsp;Favor</span>)&nbsp;
        </>
      ) : vote === "REFUSE" ? (
        <>
          (You voted&nbsp;
          <span className="text-red-500">Against</span>)&nbsp;
        </>
      ) : (
        ""
      );

    return (
      <Label className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <div className="justify-starttext-nowrap flex text-gray-500">
          {votedText}
          <div className="flex gap-2">
            <span className="text-red-500">{refuse}</span>
            Against |&nbsp;
          </div>
          <div className="flex gap-2">
            <span className="text-green-500">{accept}</span>
            In Favor
          </div>
        </div>
      </Label>
    );
  }

  function handleVoteState(): JSX.Element {
    if (currentWalletVote?.applicantKey === userKey) {
      const vote = currentWalletVote.vote;
      if (vote === "ACCEPT" || vote === "REFUSE") {
        const revokeVoteButton = (
          <div className="flex flex-row flex-wrap gap-4">
            {handleInFavorAgainstText(vote)}
            <Label className="flex items-center justify-center gap-2 text-xs">
              <Button
                onClick={() => handleRemoveVote()}
                variant="outline"
                title="Reject"
              >
                Revoke Vote
              </Button>
            </Label>
          </div>
        );
        return revokeVoteButton;
      }
    }
    const toVoteButton = (
      <div className="flex flex-row flex-wrap gap-4">
        {handleInFavorAgainstText("")}
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => handleVote("REFUSE")}
            variant="outline"
            className="border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500"
            title="Reject"
          >
            Refuse
          </Button>
          <Button
            onClick={() => handleVote("ACCEPT")}
            variant="outline"
            className="border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-500"
            title="Approve"
          >
            Accept
          </Button>
        </div>
      </div>
    );
    return toVoteButton;
  }

  return (
    <Card className="md:text-md flex flex-col border border-gray-800 bg-[#0E0E11] p-7 text-xs sm:text-sm lg:text-base">
      <CardHeader className="flex-row flex-wrap justify-between gap-3 p-0 text-xs">
        <div className="flex flex-row flex-wrap gap-4">
          <Image
            width={50}
            height={50}
            src={avatarUrl ?? "https://cdn.discordapp.com/embed/avatars/4.png"}
            alt={`${userNames}'s avatar`}
          />
          <div className="flex flex-col justify-center gap-1">
            <Label className="">
              {userNames} (#{discordIds})
            </Label>
            <div className="flex gap-2 font-bold text-gray-500">
              <CopyButton
                copy={userKey}
                variant={"link"}
                className="text-muted-foreground h-5 items-center p-0 text-xs hover:text-gray-300"
              >
                <Crown />
                {smallAddress(userKey, 10)}
              </CopyButton>

              <div className="flex items-center gap-1">
                <Icons.Calendar />
                <Label className="text-xs">
                  {DateTime.fromJSDate(dateCreated).toLocaleString(
                    DateTime.DATE_SHORT,
                  )}
                </Label>
              </div>
            </div>
          </div>
        </div>
        {handleVoteState()}
      </CardHeader>
      <Separator className="my-4" />
      <CardContent className="flex p-0 text-left text-gray-200/80">
        {contentValue}
      </CardContent>
    </Card>
  );
}
