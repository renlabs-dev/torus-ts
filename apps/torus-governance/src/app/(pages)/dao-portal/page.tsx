import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { CreateCadreCandidates } from "~/app/_components/agent-application/create-cadre-candidates";
import { CandidateCard } from "~/app/_components/cadre/candidate-card";
import { api } from "~/trpc/server";
import type { CandidacyStatus } from "~/utils/types";
import { ViewSelector } from "./_components/view-selector";

export default async function DaoPortalPage(props: {
  searchParams: Promise<{
    status: CandidacyStatus | undefined;
  }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status;

  const candidates = await api.cadreCandidate.filteredByStatusWithDiscord({
    status: status,
  });

  return (
    <div className="flex w-full flex-col pb-10">
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
        <div>
          <CreateCadreCandidates />
        </div>
        <ViewSelector currentStatus={status ?? "PENDING"} />
      </div>
      {candidates.length === 0 ? (
        <ContentNotFound message="No candidates matching the search criteria were found." />
      ) : (
        <div className="mt-4 flex flex-col space-y-4">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.discordId} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
