"use client";

import { smallAddress } from "@torus-network/torus-utils/subspace";
import { CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Label } from "@torus-ts/ui/components/label";
import { api } from "~/trpc/react";
import { useComputedCandidateVotes } from "hooks/use-computed-candidate-votes";
import { Calendar1, KeyRound } from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import type { CandidateCardProps } from "../index";
import { HandleCandidacyState } from "./handle-candidacy-state";

export function CandidateCardHeader({ candidate }: CandidateCardProps) {
  const { data: curatorVoteHistory, isLoading } =
    api.cadreVoteHistory.all.useQuery();

  const { accept, refuse, revoke } = useComputedCandidateVotes({
    candidacyStatus: candidate.candidacyStatus,
    userKey: candidate.userKey,
    curatorVoteHistory,
  });

  return (
    <CardHeader className="flex flex-col justify-between gap-3 md:flex-row">
      <div className="flex flex-row gap-4">
        <Image
          width={1000}
          height={1000}
          src={
            candidate.avatarUrl ??
            "https://cdn.discordapp.com/embed/avatars/4.png"
          }
          alt={`${candidate.userName}'s avatar`}
          className="h-16 w-16"
        />
        <div className="flex flex-col justify-center sm:-space-y-2">
          <div className="flex flex-col-reverse items-start justify-start md:flex-row md:items-center md:gap-1">
            <Label>{candidate.userName ?? "User not found"}</Label>
            <CopyButton
              copy={candidate.discordId}
              variant="link"
              className="text-muted-foreground items-center p-0 hover:text-gray-300"
            >
              (#{smallAddress(candidate.discordId, 5)})
            </CopyButton>
          </div>

          <div className="flex items-center justify-start gap-4 font-bold text-gray-200">
            <CopyButton
              copy={candidate.userKey}
              variant={"link"}
              className="text-muted-foreground flex items-center p-0 hover:text-gray-300"
            >
              <KeyRound />
              {smallAddress(candidate.userKey, 10)}
            </CopyButton>

            <Label className="text-muted-foreground hidden items-center gap-1.5 text-sm md:flex">
              <Calendar1 width={16} height={16} />
              {isLoading ? (
                <p className="animate-pulse">00/00/0000</p>
              ) : (
                DateTime.fromJSDate(candidate.createdAt).toLocaleString(
                  DateTime.DATE_SHORT,
                )
              )}
            </Label>
          </div>
        </div>
      </div>
      <HandleCandidacyState
        accept={accept}
        refuse={refuse}
        revoke={revoke}
        candidate={candidate}
      />
    </CardHeader>
  );
}
