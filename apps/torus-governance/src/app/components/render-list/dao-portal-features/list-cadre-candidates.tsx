import { useSearchParams } from "next/navigation";
import { useGovernance } from "~/context/governance-provider";
import { ListCardsLoadingSkeleton } from "./list-cards-skeleton";
import { CuratorCandidatesList } from "../../cadre/curator-candidates-list";
import { ListContainer } from "../list-container";

export const ListCadreCandidates = () => {
  const { cadreCandidates } = useGovernance();

  const { data: cadreCandidatesList, isFetching: isFetchingCadreCandidates } =
    cadreCandidates;
  const searchParams = useSearchParams();

  if (!cadreCandidatesList && isFetchingCadreCandidates)
    return <ListCardsLoadingSkeleton />;

  if (!cadreCandidatesList) return <p>No Curator DAO candidates found.</p>;

  const filteredCadreCandidates = cadreCandidatesList.map((candidate) => {
    const search = searchParams.get("search")?.toLocaleLowerCase();
    if (
      search &&
      !candidate.content.toLocaleLowerCase().includes(search) &&
      !candidate.discordId.toLocaleLowerCase().includes(search) &&
      !candidate.userKey.toLocaleLowerCase().includes(search)
    ) {
      return;
    }

    return (
      <CuratorCandidatesList key={candidate.id} curatorCandidate={candidate} />
    );
  });
  return (
    <ListContainer
      smallesHeight={325}
      className="max-h-[calc(100svh-325px)] !animate-fade lg:max-h-[calc(100svh-265px)]"
    >
      {filteredCadreCandidates}
    </ListContainer>
  );
};
