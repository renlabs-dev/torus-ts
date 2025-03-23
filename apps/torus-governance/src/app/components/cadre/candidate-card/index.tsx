"use client";

import { CandidateCardContent } from "./components/card-content";
import { CandidateCardHeader } from "./components/card-header";
import type { AppRouter } from "@torus-ts/api";
import { Card } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import type { inferProcedureOutput } from "@trpc/server";

export type Candidate = NonNullable<
  inferProcedureOutput<AppRouter["cadreCandidate"]["allWithDiscord"]>
>[number];

export type CuratorVoteHistory = NonNullable<
  inferProcedureOutput<AppRouter["cadreVoteHistory"]["all"]>
>;

export interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="md:text-md flex flex-col border border-gray-800 bg-[#0E0E11] p-7 text-xs sm:text-sm lg:text-base">
      <CandidateCardHeader candidate={candidate} />
      <Separator className="my-4" />
      <CandidateCardContent candidate={candidate} />
    </Card>
  );
}
