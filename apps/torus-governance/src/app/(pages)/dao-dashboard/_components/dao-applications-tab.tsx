"use client";

import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { CreateCadreCandidates } from "~/app/_components/agent-application/create-cadre-candidates";
import { CandidateCard } from "~/app/_components/cadre/candidate-card";
import { api } from "~/trpc/react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import type { CandidacyStatus } from "~/utils/types";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";

const statusOptions = [
  { label: "Candidates", value: "PENDING" },
  { label: "DAO Members", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Removed", value: "REMOVED" },
];

export default function DaoApplicationsTab() {
  const [status, setStatus] = useState<CandidacyStatus>("PENDING");

  const { data: candidates, isLoading } =
    api.cadreCandidate.filteredByStatusWithDiscord.useQuery({
      status: status,
    });

  const handleStatusChange = (value: string) => {
    if (["PENDING", "ACCEPTED", "REJECTED", "REMOVED"].includes(value)) {
      setStatus(value as CandidacyStatus);
    }
  };

  return (
    <div className="flex w-full flex-col pb-10 pt-2 animate-fade">
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
        <CreateCadreCandidates />
        <div className="flex w-full items-center md:w-fit">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="min-w-full md:w-[240px]">
              <SelectValue placeholder="Select candidate status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4">Loading...</div>
      ) : candidates && candidates.length === 0 ? (
        <ContentNotFound message="No candidates matching the search criteria were found." />
      ) : (
        <ScrollArea className="h-[32.2rem] pt-4">
          <div className="flex flex-col gap-4 pb-4">
            {candidates?.map((candidate) => (
              <CandidateCard key={candidate.discordId} candidate={candidate} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
