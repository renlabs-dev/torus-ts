"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronsDown,
  ChevronsUp,
  ClockArrowDown,
  ClockArrowUp,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";

import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

import { api } from "~/trpc/react";
import { ReportComment } from "./report-comment";

export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}

type SorterTypes = "newest" | "oldest" | "mostUpvotes";

const commentSorters: { icon: JSX.Element; sortBy: SorterTypes }[] = [
  {
    icon: <ClockArrowDown />,
    sortBy: "oldest",
  },
  {
    icon: <ClockArrowUp />,
    sortBy: "newest",
  },
  {
    icon: <ThumbsUp />,
    sortBy: "mostUpvotes",
  },
];

const LoadingComments = () => {
  return (
    <Card className="relative flex w-full flex-col gap-2 p-2 pb-4">
      <CardHeader className="flex flex-row justify-between px-2 py-1 pb-2">
        <span className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-48" />
        </span>
        <div className="flex gap-1">
          <Skeleton className="h-6 w-7" />
          <Skeleton className="h-6 w-7" />
        </div>
      </CardHeader>
      <CardContent className="flex px-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="absolute bottom-2 right-2 h-7 w-8" />
      </CardContent>
    </Card>
  );
};

interface CommentsHeaderProps {
  sortBy: SorterTypes;
  isLoading: boolean;
  proposalComments: {
    userKey: string;
    id: string;
    createdAt: Date;
    content: string;
    proposalId: number;
    governanceModel: "PROPOSAL" | "DAO" | "FORUM" | null;
    userName: string | null;
    upvotes: number;
    downvotes: number;
  }[];
  handleCommentSorter: (value: SorterTypes) => void;
  modeType: "PROPOSAL" | "DAO";
}

const CommentsHeader = (props: CommentsHeaderProps) => {
  const { sortBy, isLoading, proposalComments, handleCommentSorter, modeType } =
    props;
  return (
    <div className="mb-4 flex w-full flex-row items-center justify-between gap-1 pb-2">
      <h2 className="w-full text-start text-lg font-semibold">
        {modeType === "PROPOSAL" ? "Proposal Discussion" : "DAO Cadre Comments"}
      </h2>
      <ToggleGroup
        type="single"
        value={sortBy}
        disabled={isLoading || proposalComments.length === 0}
        onValueChange={(value: SorterTypes) => handleCommentSorter(value)}
        className="flex gap-2"
      >
        {commentSorters.map((sorter) => (
          <ToggleGroupItem
            key={sorter.sortBy}
            variant="outline"
            value={sorter.sortBy}
            className={`px-3 py-1 text-sm ${
              sortBy === sorter.sortBy
                ? "border-white"
                : "bg-card text-muted-foreground"
            }`}
          >
            {sorter.icon}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export function ViewComment({
  id,
  modeType,
}: {
  id: number;
  modeType: "PROPOSAL" | "DAO";
}) {
  const { selectedAccount } = useTorus();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null,
  );
  const [commentId, setCommentId] = useState<string | null>(null);

  const {
    data: proposalComments,
    error,
    isLoading,
    refetch,
  } = api.proposalComment.byId.useQuery(
    { type: modeType, proposalId: id },
    { enabled: typeof id === "number" },
  );

  const [localVotes, setLocalVotes] = useState<Record<string, VoteType | null>>(
    {},
  );

  const [sortBy, setSortBy] = useState<SorterTypes>("oldest");

  const sortedComments = useMemo(() => {
    if (!proposalComments) return [];
    return [...proposalComments].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        return b.upvotes - a.upvotes;
      }
    });
  }, [proposalComments, sortBy]);

  const { data: userVotes, refetch: refetchUserVotes } =
    api.proposalComment.byUserId.useQuery(
      { proposalId: id, userKey: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address && typeof id === "number" },
    );

  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!selectedAccount?.address) return;
      await refetchUserVotes();
    };
    fetchUserVotes().catch(console.error);
  }, [refetchUserVotes, selectedAccount?.address]);

  const castVoteMutation = api.proposalComment.castVote.useMutation({
    onSuccess: async () => {
      await Promise.all([refetchUserVotes(), refetch()]);
    },
  });

  const deleteVoteMutation = api.proposalComment.deleteVote.useMutation({
    onSuccess: async () => {
      await Promise.all([refetchUserVotes(), refetch()]);
    },
  });

  const localUserVotes = useMemo(() => {
    return { ...userVotes, ...localVotes };
  }, [userVotes, localVotes]);

  const handleVote = useCallback(
    async (commentId: string, voteType: VoteType) => {
      if (!selectedAccount?.address) {
        toast.error("Please connect your wallet to vote");
        return;
      }

      try {
        const commentExists = proposalComments?.some((c) => c.id === commentId);
        if (!commentExists) {
          toast.error("Comment not found");
          return;
        }

        const currentVote = userVotes?.[commentId];
        const isRemovingVote = currentVote === voteType;

        setLocalVotes((prevVotes) => ({
          ...prevVotes,
          [commentId]: isRemovingVote ? null : voteType,
        }));

        if (isRemovingVote) {
          await deleteVoteMutation.mutateAsync({ commentId });
        } else {
          await castVoteMutation.mutateAsync({ commentId, voteType });
        }
      } catch (err) {
        console.error("Error voting:", err);
        toast.error(
          "There was an error processing your vote. Please try again.",
        );
        setLocalVotes((prevVotes) => ({
          ...prevVotes,
          [commentId]: (userVotes?.[commentId] as VoteType | null) ?? null,
        }));
      }
    },
    [
      selectedAccount?.address,
      proposalComments,
      userVotes,
      castVoteMutation,
      deleteVoteMutation,
    ],
  );

  const handleCommentSorter = useCallback((sortBy: SorterTypes | "") => {
    setSortBy(sortBy || "oldest");
  }, []);

  useLayoutEffect(() => {
    if (!containerNode) {
      return;
    }

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = containerNode;
      setIsAtBottom(scrollHeight - scrollTop === clientHeight);
    };

    containerNode.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      containerNode.removeEventListener("scroll", handleScroll);
    };
  }, [containerNode]);

  if (error) {
    toast.error("Failed to load comments. Please try again later.");
    return <div>Error loading comments</div>;
  }

  if (isLoading) return <LoadingComments />;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full min-h-max animate-fade-down flex-col items-center justify-between text-white animate-delay-200">
        <CommentsHeader
          sortBy={sortBy}
          isLoading={isLoading}
          proposalComments={proposalComments ?? []}
          handleCommentSorter={handleCommentSorter}
          modeType={modeType}
        />

        {!sortedComments.length && (
          <Card className="flex h-full w-full items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-muted-foreground">No comments yet</span>
            </div>
          </Card>
        )}

        <div
          className="flex max-h-72 w-full flex-col gap-2 overflow-auto pr-2"
          ref={setContainerNode}
        >
          {sortedComments.map((comment) => {
            const currentVote = localUserVotes[comment.id];
            return (
              <Card
                key={comment.id}
                className="relative flex w-full flex-col gap-2 p-2 pb-4"
              >
                <CardHeader className="flex flex-row justify-between px-2 py-1 pb-2">
                  <div className="flex-start flex flex-row items-center gap-1.5 md:flex-row">
                    {comment.userName && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-center text-sm">
                        {comment.userName}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {smallAddress(comment.userKey, 3)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      onClick={() => handleVote(comment.id, VoteType.UP)}
                      // disabled={isVoting || !selectedAccount?.address}
                      className={`flex items-center px-1 ${currentVote === VoteType.UP ? "text-green-500" : "hover:text-green-500"} `}
                    >
                      <ChevronsUp className="h-5 w-5" />
                      <span>{comment.upvotes}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleVote(comment.id, VoteType.DOWN)}
                      // disabled={isVoting || !selectedAccount?.address}
                      className={`flex items-center px-1 ${currentVote === VoteType.DOWN ? "text-red-500" : "hover:text-red-500"}`}
                    >
                      <ChevronsDown className="h-5 w-5" />
                      <span>{comment.downvotes}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-2">
                  <p className="text-muted-foreground">{comment.content}</p>
                  <Button
                    variant="outline"
                    onClick={() => setCommentId(comment.id)}
                    type="button"
                    className="absolute bottom-2 right-2 h-7 border border-red-500 px-1.5 text-red-500 opacity-30 transition duration-200 hover:text-red-500 hover:opacity-100"
                  >
                    <TriangleAlert size={16} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          <span
            className={`fixed bottom-0 flex w-full items-end justify-center ${isAtBottom ? "h-0 animate-fade" : "h-8 animate-fade"} bg-gradient-to-b from-[#04061C1A] to-[#04061C] transition-all duration-75 delay-none`}
          />
        </div>
      </div>

      <ReportComment commentId={commentId} setCommentId={setCommentId} />
    </div>
  );
}
