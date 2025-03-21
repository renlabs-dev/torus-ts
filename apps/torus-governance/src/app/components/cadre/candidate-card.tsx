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
    avatarUrl = "https://cdn.discordapp.com/embed/avatars/4.png",
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

  const { accept, refuse, revoke } = computedVotes();

  return (
    <Card className="flex flex-col border border-gray-800 bg-[#0E0E11] p-4">
      <CardHeader className="flex-row justify-between gap-2 p-0 text-xs">
        <div>
          <img src={avatarUrl} alt={`${userNames}'s avatar`} />
        </div>
        <div className="flex w-full flex-col justify-center gap-1">
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

        <div className="flex w-full flex-row">
          <Label className="flex w-full items-center justify-center gap-2 text-xs">
            <span className="text-red-500">{refuse}</span>
            Against |<span className="text-green-500">{accept}</span> In Favor
          </Label>
          <Label className="flex w-full items-center justify-center gap-2">
            <Button
              onClick={() => handleVote("REFUSE")}
              variant="outline"
              className="w-full border-red-500 bg-red-500/20 font-bold text-red-500 hover:bg-red-500/30 hover:text-red-500"
              title="Reject"
            >
              Refuse
            </Button>
            <Button
              onClick={() => handleVote("ACCEPT")}
              variant="outline"
              className="w-full border-green-500 bg-green-500/20 font-bold text-green-500 hover:bg-green-500/30 hover:text-green-500"
              title="Approve"
            >
              Accept
            </Button>
          </Label>
        </div>
      </CardHeader>
      <Separator className="my-4" />
      <CardContent className="flex text-left">{contentValue}</CardContent>
    </Card>
  );
}
