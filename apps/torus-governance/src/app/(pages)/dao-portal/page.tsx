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
      <ViewSelector currentStatus={status ?? "PENDING"} />

      {candidates.length === 0 ? (
        <div className="mt-4 text-center text-gray-500">
          No candidates with status: {status}
        </div>
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
