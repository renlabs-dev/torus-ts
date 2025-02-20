"use client";

import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Crown, TicketX } from "lucide-react";
import { DateTime } from "luxon";
import { useCallback } from "react";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

type CandidacyStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "REMOVED";

type VoteType = "ACCEPT" | "REFUSE" | "REMOVE";

interface Candidate {
  userKey: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  id: number;
  content: string;
  discordId: string;
  candidacyStatus: CandidacyStatus;
}

interface VoteAlreadyCastFooterActionsProps {
  voted: VoteType;
  voteLoading: boolean;
  handleRemoveVote: () => void;
}

const handleStatusColors = (status: CandidacyStatus) => {
  const statusColors = {
    ACCEPTED: "text-green-400 ring-green-400/20",
    REJECTED: "text-red-400 ring-red-400/20",
    PENDING: "text-gray-400 ring-gray-400/20",
    REMOVED: "text-pink-400 ring-pink-400/20",
  };

  return statusColors[status];
};

function VoteAlreadyCastFooterActions({
  voted,
  voteLoading,
  handleRemoveVote,
}: Readonly<VoteAlreadyCastFooterActionsProps>) {
  const messages: Record<
    "ACCEPT" | "REFUSE" | "REMOVE",
    { text: string; className: string }
  > = {
    ACCEPT: {
      text: "You already voted in favor.",
      className: "text-green-400",
    },
    REFUSE: {
      text: "You already voted against.",
      className: "text-red-400",
    },
    REMOVE: {
      text: "You already voted to remove this user from the Curator DAO.",
      className: "text-red-400",
    },
  };

  const { text, className } = messages[voted];

  return (
    <Card className="animate-fade flex w-full flex-col items-center justify-center p-4">
      <span className={className}>{text}</span>
      <Button
        variant="link"
        className="w-fit p-0"
        onClick={handleRemoveVote}
        disabled={voteLoading}
        type="button"
      >
        {voteLoading ? (
          "Processing..."
        ) : (
          <span className="flex items-center justify-center gap-2">
            <TicketX className="h-5 w-5" />
            Remove Vote
          </span>
        )}
      </Button>
    </Card>
  );
}

const UserHasNotVotedFooterActions = (props: {
  handleVote: (vote: "ACCEPT" | "REFUSE") => Promise<void>;
}) => {
  const { handleVote } = props;
  return (
    <div className="animate-fade flex w-full gap-4">
      <Button
        onClick={() => handleVote("REFUSE")}
        variant="destructive"
        className="relative w-full py-4 text-sm font-semibold"
      >
        Refuse
      </Button>
      <Button
        onClick={() => handleVote("ACCEPT")}
        className="relative w-full py-4 text-sm font-semibold"
      >
        Accept
      </Button>
    </div>
  );
};

const CandidateAlreadyAcceptedFooterActions = (props: {
  handleVote: (vote: "REMOVE") => Promise<void>;
}) => {
  const { handleVote } = props;
  return (
    <div className="animate-fade flex w-full gap-4">
      <Button
        onClick={() => handleVote("REMOVE")}
        variant="destructive"
        className="relative w-full py-4 text-sm font-semibold"
      >
        Remove from Curator DAO
      </Button>
    </div>
  );
};

interface CuratorCandidateCardProps {
  curatorCandidate: Candidate;
}

export const CuratorCandidatesList = (props: CuratorCandidateCardProps) => {
  const { curatorCandidate } = props;
  const { selectedAccount } = useGovernance();

  const {
    data: curatorVotes,
    refetch: refetchCuratorVotes,
    isFetching,
  } = api.cadreVote.byId.useQuery({
    applicantKey: curatorCandidate.userKey,
  });

  const { data: curatorVoteHistory } = api.cadreVoteHistory.all.useQuery();

  const createCadreVote = api.cadreVote.create.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });
  const deleteCadreVote = api.cadreVote.delete.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const computedVotes = () => {
    if (curatorCandidate.candidacyStatus === "PENDING") {
      const votes = curatorVotes ?? [];
      return {
        accept: votes.filter((v) => v.vote === "ACCEPT").length,
        refuse: votes.filter((v) => v.vote === "REFUSE").length,
        revoke: 0,
      };
    } else {
      const votes =
        curatorVoteHistory?.filter(
          (v) => v.applicantKey === curatorCandidate.userKey,
        ) ?? [];
      return {
        accept: votes.filter((v) => v.vote === "ACCEPT").length,
        refuse: votes.filter((v) => v.vote === "REFUSE").length,
        revoke: curatorVotes?.length ?? 0,
      };
    }
  };

  const currentWalletVote = curatorVotes?.find(
    (vote) => vote.userKey === selectedAccount?.address,
  );

  const handleVote = async (vote: "ACCEPT" | "REFUSE" | "REMOVE") => {
    await createCadreVote.mutateAsync({
      vote,
      applicantKey: curatorCandidate.userKey,
    });
  };

  const handleRemoveVote = async () => {
    await deleteCadreVote.mutateAsync({
      applicantKey: curatorCandidate.userKey,
    });
  };

  const FooterAction = useCallback(() => {
    if (curatorCandidate.candidacyStatus === "PENDING" && !currentWalletVote) {
      return <UserHasNotVotedFooterActions handleVote={handleVote} />;
    }

    if (currentWalletVote) {
      return (
        <VoteAlreadyCastFooterActions
          voteLoading={isFetching}
          voted={currentWalletVote.vote}
          handleRemoveVote={handleRemoveVote}
        />
      );
    }

    if (curatorCandidate.candidacyStatus === "ACCEPTED") {
      return <CandidateAlreadyAcceptedFooterActions handleVote={handleVote} />;
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curatorCandidate, currentWalletVote]);

  const { accept, refuse, revoke } = computedVotes();

  const renderVotesCount = () => {
    if (
      curatorCandidate.candidacyStatus === "PENDING" ||
      curatorCandidate.candidacyStatus === "REJECTED"
    ) {
      return (
        <>
          <span>
            In favor <span className="ml-2 text-green-400">{accept}</span>
          </span>
          <span className="pl-2">
            <span className="mr-2 text-red-400">{refuse}</span> Against
          </span>
        </>
      );
    }

    return (
      <span>
        <span className="mr-2 text-red-400">{revoke}</span> Revoke
      </span>
    );
  };

  return (
    <Card className="relative">
      <li className={`relative flex h-full flex-col`}>
        <CardHeader className="w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                #{curatorCandidate.discordId}
              </h3>

              <span
                className={`bg-muted-foreground/5 items-center rounded-full px-1.5 py-0.5 ${handleStatusColors(curatorCandidate.candidacyStatus)} text-xs font-medium ring-1 ring-inset`}
              >
                {curatorCandidate.candidacyStatus}
              </span>
            </div>
            <CopyButton
              copy={curatorCandidate.userKey}
              variant={"link"}
              notify={() => toast.success("Copied to clipboard")}
              className="text-muted-foreground h-5 items-center p-0 text-sm hover:text-white"
            >
              <Crown size={10} />
              {smallAddress(curatorCandidate.userKey, 10)}
            </CopyButton>
          </div>

          <p className="text-sm text-gray-500">
            {DateTime.fromJSDate(curatorCandidate.createdAt).toLocaleString(
              DateTime.DATETIME_SHORT,
            )}
          </p>
        </CardHeader>

        <CardContent>
          <p className="text-pretty">{curatorCandidate.content}</p>
        </CardContent>

        <CardFooter className="mt-auto flex flex-col gap-4">
          <div className="text-muted-foreground flex w-full gap-2 divide-x divide-white/10 text-sm">
            {renderVotesCount()}
          </div>

          <div className="flex w-full gap-4">
            <FooterAction />
          </div>
        </CardFooter>
      </li>
    </Card>
  );
};
