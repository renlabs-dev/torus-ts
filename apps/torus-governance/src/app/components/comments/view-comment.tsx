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
import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";

//  "LIKE" | "DISLIKE"
export type CommentInteractionReactionType = NonNullable<
  inferProcedureOutput<AppRouter["commentInteraction"]["byId"]>
>["reactionType"];

type SorterTypes = "newest" | "oldest" | "mostUpvotes";

const commentSorters: { icon: JSX.Element; sortBy: SorterTypes, description: string }[] = [
  {
    icon: <ClockArrowDown />,
    sortBy: "oldest",
    description: "oldest",
  },
  {
    icon: <ClockArrowUp />,
    sortBy: "newest",
    description: "newest",
  },
  {
    icon: <ThumbsUp />,
    sortBy: "mostUpvotes",
    description: "most upvotes",
  },
];

const LoadingComments = () => {
  return (
    <Card className="relative flex w-full animate-fade-down flex-col gap-2 p-2 pb-4 animate-delay-700">
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

export type Comments = NonNullable<
  inferProcedureOutput<AppRouter["comment"]["byId"]>
>;

interface CommentsHeaderProps {
  sortBy: SorterTypes;
  isLoading: boolean;
  comments: Comments;
  handleCommentSorter: (value: SorterTypes) => void;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
}

const CommentsHeader = (props: CommentsHeaderProps) => {
  const { sortBy, isLoading, comments, handleCommentSorter, itemType } = props;
  return (
    <div className="flex w-full flex-row items-center justify-between gap-1 pb-2">
      <h2 className="w-full text-start text-lg font-semibold">
        {itemType === "PROPOSAL" ? "Proposal Discussion" : "Curator DAO Comments"}
      </h2>
      <ToggleGroup
        type="single"
        value={sortBy}
        disabled={isLoading || comments.length === 0}
        onValueChange={(value: SorterTypes) => handleCommentSorter(value)}
        className="flex gap-2"
      >
        {commentSorters.map((sorter) => (
          <ToggleGroupItem
            key={sorter.sortBy}
            variant="outline"
            value={sorter.sortBy}
            className={`px-3 py-1 text-sm ${sortBy === sorter.sortBy
              ? "border-white"
              : "bg-card text-muted-foreground"
              }`}
            title={`Sort comments by ${sorter.description}`}
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
  itemType,
}: {
  id: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
}) {
  const { selectedAccount } = useTorus();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null,
  );
  const [commentId, setCommentId] = useState<number | null>(null);

  const {
    data: comments,
    error,
    isLoading,
    refetch,
  } = api.comment.byId.useQuery(
    { type: itemType, proposalId: id },
    { enabled: typeof id === "number" },
  );

  const [sortBy, setSortBy] = useState<SorterTypes>("oldest");

  const sortedComments = useMemo(() => {
    if (!comments) return [];
    return comments.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        return b.likes - a.likes;
      }
    });
  }, [comments, sortBy]);

  const { data: userVotes, refetch: refetchUserVotes } =
    api.commentInteraction.byUserId.useQuery(
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

  const castVoteMutation = api.commentInteraction.reaction.useMutation({
    onSuccess: async () => {
      await Promise.all([refetchUserVotes(), refetch()]);
    },
    onError: (err) => {
      throw new Error(JSON.stringify(err));
    },
  });

  const deleteVoteMutation = api.commentInteraction.deleteReaction.useMutation({
    onSuccess: async () => {
      await Promise.all([refetchUserVotes(), refetch()]);
    },
  });

  const handleVote = useCallback(
    async (commentId: number, reactionType: CommentInteractionReactionType) => {
      if (!selectedAccount?.address) {
        toast.error("Please connect your wallet to vote");
        return;
      }

      try {
        const commentExists = comments?.some((c) => c.id === commentId);
        if (!commentExists) {
          toast.error("Comment not found");
          return;
        }

        const currentVote = userVotes?.[commentId];
        const isRemovingVote = currentVote === reactionType;

        if (isRemovingVote) {
          await deleteVoteMutation.mutateAsync({ commentId });
        } else {
          await castVoteMutation.mutateAsync({ commentId, reactionType });
        }
      } catch (err) {
        console.error("Error voting:", err);
        toast.error(
          "There was an error processing your vote. Please try again.",
        );
      }
    },
    [
      selectedAccount?.address,
      comments,
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
      <div className="flex h-full min-h-max animate-fade-down flex-col items-center justify-between text-white animate-delay-700">
        <CommentsHeader
          sortBy={sortBy}
          isLoading={isLoading}
          comments={comments ?? []}
          handleCommentSorter={handleCommentSorter}
          itemType={itemType}
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
            const currentVote = userVotes?.[comment.id];
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
                      title="Upvote"
                      onClick={() => handleVote(comment.id, "LIKE")}
                      // disabled={isVoting || !selectedAccount?.address}
                      className={`flex items-center px-1 ${currentVote === "LIKE" ? "text-green-500" : "hover:text-green-500"}`}
                    >
                      <ChevronsUp className="h-5 w-5" />
                      <span>{comment.likes}</span>
                    </Button>
                    <Button
                      variant="outline"
                      title="Downvote"
                      onClick={() => handleVote(comment.id, "DISLIKE")}
                      // disabled={isVoting || !selectedAccount?.address}
                      className={`flex items-center px-1 ${currentVote === "DISLIKE" ? "text-red-500" : "hover:text-red-500"}`}
                    >
                      <ChevronsDown className="h-5 w-5" />
                      <span>{comment.dislikes}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-2">
                  <p className="text-muted-foreground">{comment.content}</p>
                  <Button
                    variant="outline"
                    title="Report comment"
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
            className={`fixed bottom-0 flex w-full items-end justify-center ${isAtBottom ? "h-0 animate-fade" : "h-8 animate-fade"} bg-gradient-to-b from-transparent to-background transition-all duration-75 delay-none`}
          />
        </div>
      </div>

      <ReportComment commentId={commentId} setCommentId={setCommentId} />
    </div>
  );
}
