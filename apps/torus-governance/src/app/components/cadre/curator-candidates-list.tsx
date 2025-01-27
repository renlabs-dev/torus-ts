"use client";
import { toast } from "@torus-ts/toast-provider";
import { DateTime } from "luxon";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CopyButton,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Crown, TicketX } from "lucide-react";
import { api } from "~/trpc/react";
import { useGovernance } from "~/context/governance-provider";
import { useCallback } from "react";

type CandidacyStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "REMOVED";

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
  voted: "ACCEPT" | "REFUSE" | "REMOVE";
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
}: VoteAlreadyCastFooterActionsProps) {
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
    <Card className="flex w-full animate-fade flex-col items-center justify-center p-4">
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
    <div className="flex w-full animate-fade gap-4">
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
    <div className="flex w-full animate-fade gap-4">
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

  const createCadreVote = api.cadreVote.create.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });
  const deleteCadreVote = api.cadreVote.delete.useMutation({
    onSuccess: () => refetchCuratorVotes(),
  });

  const computedVotes = curatorVotes?.reduce(
    (acc, vote) => {
      if (vote.vote === "ACCEPT") {
        acc.accept++;
      } else if (vote.vote === "REFUSE") {
        acc.refuse++;
      }
      return acc;
    },
    { accept: 0, refuse: 0 },
  );

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
                className={`items-center rounded-full bg-muted-foreground/5 px-1.5 py-0.5 ${handleStatusColors(curatorCandidate.candidacyStatus)} text-xs font-medium ring-1 ring-inset`}
              >
                {curatorCandidate.candidacyStatus}
              </span>
            </div>
            <CopyButton
              copy={curatorCandidate.userKey}
              variant={"link"}
              notify={() => toast.success("Copied to clipboard")}
              className="h-5 items-center p-0 text-sm text-muted-foreground hover:text-white"
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
          <div className="flex w-full gap-2 divide-x divide-white/10 text-sm text-muted-foreground">
            <span>
              In favor
              <span className="ml-2 text-green-400">
                {computedVotes?.accept}
              </span>
            </span>
            <span className="pl-2">
              <span className="mr-2 text-red-400">{computedVotes?.refuse}</span>
              Against
            </span>
          </div>

          <div className="flex w-full gap-4">
            <FooterAction />
          </div>
        </CardFooter>
      </li>
    </Card>
  );
};
