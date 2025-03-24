"use client";

import type { CandidateCardProps } from "../index";
import { HandleCandidacyState } from "./handle-candidacy-state";
import { CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Label } from "@torus-ts/ui/components/label";
import { smallAddress } from "@torus-ts/utils/subspace";
import { useComputedCandidateVotes } from "hooks/use-computed-candidate-votes";
import { Crown } from "lucide-react";
import { Calendar1 } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { api } from "~/trpc/react";

export function CandidateCardHeader({ candidate }: CandidateCardProps) {
  const {
    userName,
    avatarUrl,
    discordId,
    userKey,
    createdAt,
    candidacyStatus,
  } = candidate;

  const { data: curatorVoteHistory } = api.cadreVoteHistory.all.useQuery();

  const computedVotesProps = {
    candidacyStatus,
    userKey,
    curatorVoteHistory,
  };

  const { accept, refuse, revoke } =
    useComputedCandidateVotes(computedVotesProps);

  const candidacyStateProps = {
    candidate,
    userKey,
    accept,
    refuse,
    revoke,
  };

  return (
    <CardHeader className="flex-row flex-wrap justify-between gap-3 p-0 text-xs">
      <div className="flex flex-row flex-wrap gap-4">
        <Image
          width={50}
          height={50}
          src={avatarUrl ?? "https://cdn.discordapp.com/embed/avatars/4.png"}
          alt={`${userName}'s avatar`}
        />
        <div className="flex flex-col justify-center gap-1">
          <div className="flex gap-2 font-bold text-gray-200">
            <Label className="">{userName ?? "User not found"}</Label>
            <CopyButton
              copy={discordId}
              variant={"link"}
              className="text-muted-foreground h-5 items-center p-0 text-xs hover:text-gray-300"
            >
              (#{smallAddress(discordId, 5)})
            </CopyButton>
          </div>
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
              <Calendar1 width={14} height={14} />
              <Label className="text-xs">
                {DateTime.fromJSDate(createdAt).toLocaleString(
                  DateTime.DATE_SHORT,
                )}
              </Label>
            </div>
          </div>
        </div>
      </div>
      {HandleCandidacyState(candidacyStateProps)}
    </CardHeader>
  );
}
