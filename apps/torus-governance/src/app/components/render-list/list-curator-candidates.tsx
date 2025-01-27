"use client";
import { useSearchParams } from "next/navigation";
import { CardSkeleton } from "../card-skeleton";
import { CuratorCandidatesList } from "../cadre/curator-candidates-list";
import { ListContainer } from "./list-container";
import { useGovernance } from "~/context/governance-provider";
import { Card } from "@torus-ts/ui";
import { useSignIn } from "hooks/use-sign-in";
import { CuratorNotAuthenticated } from "../cadre/curator-not-authenticated";

const ListCardsLoadingSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      <div className="animate-fade-up animate-delay-200">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-500">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-700">
        <CardSkeleton />
      </div>
    </div>
  );
};

export const ListCuratorCandidates = () => {
  const { selectedAccount, cadreCandidates } = useGovernance();

  const { isUserAuthenticated, authenticateUser } = useSignIn();
  const { data: cadreCandidatesList, isFetching: isFetchingCadreCandidates } =
    cadreCandidates;

  const searchParams = useSearchParams();

  if (!selectedAccount)
    return (
      <Card className="py-8">
        <p className="text-center">
          Are you a Curator DAO member?
          <br /> Please connect your wallet to view this page.
        </p>
      </Card>
    );

  if (!isUserAuthenticated)
    return <CuratorNotAuthenticated authenticateUser={authenticateUser} />;

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
