"use client";

import type { AppRouter } from "@torus-ts/api";
import { Card } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import type { inferProcedureOutput } from "@trpc/server";
import { CandidateCardContent } from "./components/card-content";
import { CandidateCardHeader } from "./components/card-header";

export type Candidate = NonNullable<
  inferProcedureOutput<AppRouter["cadreCandidate"]["allWithDiscord"]>
>[number];

export interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-6">
      <CandidateCardHeader candidate={candidate} />
      <Separator className="my-4" />
      <CandidateCardContent candidate={candidate} />
    </Card>
  );
}
