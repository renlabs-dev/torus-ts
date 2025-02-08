import Link from "next/link";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomProposal } from "~/utils";
import { CardViewData } from "../card-view-data";
import { useSearchParams } from "next/navigation";
import type { ProposalStatus, SS58Address } from "@torus-ts/subspace";
import type { VoteStatus } from "../vote-label";
import { CardSkeleton } from "../card-skeleton";
import { ListContainer } from "./container-list";

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

function getUserVoteStatus(
  proposalStatus: ProposalStatus,
  selectedAccountAddress: SS58Address,
): VoteStatus {
  if (!("Open" in proposalStatus)) return "UNVOTED";

  const { votesFor, votesAgainst } = proposalStatus.Open;
  if (votesFor.includes(selectedAccountAddress)) return "FAVORABLE";
  if (votesAgainst.includes(selectedAccountAddress)) return "AGAINST";

  return "UNVOTED";
}

export const ListProposals = () => {
  const {
    proposalsWithMeta,
    selectedAccount,
    lastBlock,
    isInitialized,
    proposals,
  } = useGovernance();
  const currentBlock = lastBlock.data?.blockNumber;
  const searchParams = useSearchParams();

  const isLoadingProposals = () => {
    if (!proposalsWithMeta || proposals.isPending || !isInitialized)
      return true;
    return false;
  };

  const filteredProposals = proposalsWithMeta?.map((proposal) => {
    const { title, invalid, body } = handleCustomProposal(proposal);
    if (invalid || (!title && !body)) return;

    const search = searchParams.get("search")?.toLowerCase();
    if (
      search &&
      !title?.toLowerCase().includes(search) &&
      !body?.toLowerCase().includes(search) &&
      !proposal.proposer.toLowerCase().includes(search)
    ) {
      return;
    }

    const voted = getUserVoteStatus(
      proposal.status,
      selectedAccount?.address as SS58Address,
    );

    return (
      <Link href={`/proposal/${proposal.id}`} key={proposal.id} prefetch>
        <CardViewData
          title={title}
          author={proposal.proposer}
          voted={voted}
          proposalType={proposal.data}
          proposalStatus={proposal.status}
          expirationBlock={proposal.expirationBlock}
          currentBlock={currentBlock}
        />
      </Link>
    );
  });

  if (isLoadingProposals()) return <ListCardsLoadingSkeleton />;

  if (!filteredProposals) return <p>No proposals found.</p>;

  return <ListContainer>{filteredProposals}</ListContainer>;
};
