import { Card, CardContent } from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import type { Candidate } from "~/utils/types";
import { CandidateCardHeader } from "./components/card-header";

export interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard(props: CandidateCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <CandidateCardHeader {...props} />

      <CardContent>
        <Separator />
        <p className="text-foreground pt-4 text-sm">
          {props.candidate.content}
        </p>
      </CardContent>
    </Card>
  );
}
