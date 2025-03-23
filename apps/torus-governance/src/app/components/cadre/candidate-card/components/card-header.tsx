"use client";

import type { CandidateCardProps } from "../index";
import { computedVotes } from "./computed-votes";
import { handleVoteState } from "./handle-vote-state";
import { CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Icons } from "@torus-ts/ui/components/icons";
import { Label } from "@torus-ts/ui/components/label";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Crown } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { api } from "~/trpc/react";

export function CandidateCardHeader({ candidate }: CandidateCardProps) {
  const {
    userName: userNames = "empty",
    avatarUrl,
    discordId: discordIds = "",
    userKey = "",
    createdAt: dateCreated = new Date("01-01-01"),
    candidacyStatus = "REMOVED",
  } = candidate;

  const { data: curatorVoteHistory } = api.cadreVoteHistory.all.useQuery();

  const { accept, refuse } = computedVotes(
    candidacyStatus,
    userKey,
    curatorVoteHistory,
  );

  return (
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
      {handleVoteState(userKey, accept, refuse)}
    </CardHeader>
  );
}
