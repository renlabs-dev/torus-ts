import { CandidateCard } from "~/app/_components/cadre/candidate-card";
import { api } from "~/trpc/server";

async function FetchCandidatesWithDiscord() {
  const result = await api.cadreCandidate.allWithDiscord();
  return (
    <div className="flex flex-col space-y-4">
      {result.map((candidate) => (
        <CandidateCard key={candidate.discordId} candidate={candidate} />
      ))}
    </div>
  );
}

export default function DaoPortalPage() {
  return (
    <div className="flex w-full flex-col pb-10">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        {/* <FilterDaoContent /> */}
      </div>
      <FetchCandidatesWithDiscord />
    </div>
  );
}
