import { Button, Card } from "@torus-ts/ui";
import { useSearchParams } from "next/navigation";
import { useGovernance } from "~/context/governance-provider";
import { CreateCadreCandidates } from "../agent-application/create-cadre-candidates";
import { CuratorCandidatesList } from "../cadre/curator-candidates-list";
import { ListCardsLoadingSkeleton } from "./cards-skeleton-list";
import { ListContainer } from "./container-list";

export const ListCadreCandidates = () => {
  const {
    selectedAccount,
    isUserAuthenticated,
    authenticateUser,
    isUserCadre,
    isUserCadreCandidate,
  } = useGovernance();

  if (!selectedAccount)
    return (
      <Card className="py-8">
        <p className="text-center">
          Are you a Curator DAO member?
          <br /> Please connect your wallet to view this page.
        </p>
      </Card>
    );

  if (isUserCadre && !isUserAuthenticated)
    return (
      <Card className="px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="text-center font-bold">You are not authenticated.</h1>
          <p className="text-center">Please sign in to view this page.</p>
          <Button
            variant="default"
            className="mt-4 px-4 py-2"
            onClick={() => authenticateUser()}
          >
            Sign in
          </Button>
        </div>
      </Card>
    );

  if (!isUserCadre && !isUserCadreCandidate)
    return (
      <Card className="py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-center font-bold">
            This content is only avaiable to Curator DAO Members.
          </h1>
          <CreateCadreCandidates />
        </div>
      </Card>
    );

  if (isUserCadreCandidate && !isUserCadre)
    return (
      <Card className="px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="text-center font-bold">
            Your candidacy is under vote.
          </h1>
          <p className="text-center">
            Access will be granted once approved. Thank you for your patience.
          </p>
        </div>
      </Card>
    );

  if (isUserCadre && isUserAuthenticated) return <CadreCandidatesList />;
};

export const CadreCandidatesList = () => {
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
  return <ListContainer>{filteredCadreCandidates}</ListContainer>;
};
