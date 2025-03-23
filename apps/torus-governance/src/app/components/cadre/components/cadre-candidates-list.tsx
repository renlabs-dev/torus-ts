"use client";

import { CandidateCard } from "../candidate-card/index";
import { Card } from "@torus-ts/ui/components/card";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";

export function CadreCandidatesList(): JSX.Element {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  // Get all candidates with Discord information
  const { data: candidatesWithDiscord = [] } =
    api.cadreCandidate.allWithDiscord.useQuery();

  // Filter candidates based on status
  const filteredCandidates = candidatesWithDiscord.filter((candidate) => {
    if (currentStatus === "all") return true;

    switch (currentStatus.toLowerCase()) {
      case "dao members":
        return candidate.candidacyStatus === "ACCEPTED";
      case "accepted":
        return candidate.candidacyStatus === "ACCEPTED";
      case "rejected":
        return candidate.candidacyStatus === "REJECTED";
      case "pending":
        return candidate.candidacyStatus === "PENDING";
      case "removed":
        return candidate.candidacyStatus === "REMOVED";
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col space-y-2">
      {filteredCandidates.map((candidate) => (
        <CandidateCard key={candidate.discordId} candidate={candidate} />
      ))}

      {/* If no candidates are found, display a message */}
      {filteredCandidates.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-xl font-semibold">
            There it is no match for the selected filter.
          </h3>
          <p className="text-gray-400">
            {currentStatus === "all"
              ? "Check back later to review and vote on new applicants to the Curator DAO."
              : "Try changing your filter selection to see other candidates."}
          </p>
        </Card>
      )}
    </div>
  );
}
