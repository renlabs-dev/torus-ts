import type { CandidateCardProps } from "../index";
import { CardContent } from "@torus-ts/ui/components/card";

export function CandidateCardContent({ candidate }: CandidateCardProps) {
  return (
    <CardContent className="flex p-0 text-left text-gray-200/80">
      {candidate.content}
    </CardContent>
  );
}
