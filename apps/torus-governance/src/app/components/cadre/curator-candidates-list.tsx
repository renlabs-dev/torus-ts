"use client";

import { ToVoteCandidateCard } from "./candidate-card";
import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/react";

export const ToVoteCadreCandidatesList = () => {
  // Get all candidates with Discord information
  const { data: candidatesWithDiscord = [] } =
    api.cadreCandidate.allWithDiscord.useQuery();

  return (
    <div className="flex flex-col space-y-2">
      {candidatesWithDiscord.map((candidate) => (
        <ToVoteCandidateCard key={candidate.discordId} candidate={candidate} />
      ))}

      {/* If no candidates are found, display a message */}
      {candidatesWithDiscord.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-xl font-semibold">Hey, this list is empty</h3>
          <p className="text-gray-400">
            There are currently no curator candidates, come back later :3.
          </p>
        </Card>
      )}
    </div>
  );
};
