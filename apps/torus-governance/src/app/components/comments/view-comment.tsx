"use client";

import { useState } from "react";
import {
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  UserIcon,
} from "@heroicons/react/20/solid";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { smallAddress } from "@torus-ts/utils";

import { api } from "~/trpc/react";
import { ReportComment } from "./report-comment";

export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}

export function ViewComment({
  proposalId,
  modeType,
}: {
  proposalId: number;
  modeType: "PROPOSAL" | "DAO";
}) {
  const { selectedAccount } = useTorus();
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, VoteType | null>>(
    {},
  );

  const {
    data: proposalComments,
    error,
    isLoading,
    refetch,
  } = api.proposalComment.byId.useQuery(
    { type: modeType, proposalId },
    { enabled: !!proposalId },
  );

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostUpvotes">(
    "oldest",
  );

  const sortedComments = proposalComments
    ? [...proposalComments].sort((a, b) => {
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
      })
    : [];

  const { data: userVotes } = api.proposalComment.byUserId.useQuery(
    { proposalId, userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address && !!proposalId },
  );

  const castVoteMutation = api.proposalComment.castVote.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteVoteMutation = api.proposalComment.deleteVote.useMutation({
    onSuccess: () => refetch(),
  });

  if (error) {
    console.error("Error fetching proposal comments:", error);
  }

  const handleVote = async (commentId: string, voteType: VoteType) => {
    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to vote");
      return;
    }

    setVotingCommentId(commentId);

    try {
      const commentExists = proposalComments?.some((c) => c.id === commentId);
      if (!commentExists) return;

      const currentVote = Object.hasOwn(localVotes, commentId)
        ? localVotes[commentId]
        : userVotes?.[commentId];

      const isRemovingVote = currentVote === voteType;
      const newVoteType = isRemovingVote ? null : voteType;

      if (isRemovingVote) {
        await deleteVoteMutation.mutateAsync({ commentId });
      } else {
        await castVoteMutation.mutateAsync({ commentId, voteType });
      }

      setLocalVotes((prev) => ({ ...prev, [commentId]: newVoteType }));
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setVotingCommentId(null);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <div className="m-2 flex h-full min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md animate-delay-200">
        <div className="mb-4 flex w-full flex-col items-center justify-between gap-1 border-b border-gray-500 border-white/20 pb-2 text-gray-400 md:flex-row">
          <h2 className="w-full text-start font-semibold">
            {modeType === "PROPOSAL"
              ? "Community Comments"
              : "DAO Cadre Comments"}
          </h2>
          <div className="flex w-full space-x-2 md:justify-end">
            {["oldest", "newest", "mostUpvotes"].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option as typeof sortBy)}
                className={`px-3 py-1 text-sm ${
                  sortBy === option
                    ? "border border-green-500 bg-green-500/20 text-white"
                    : "border border-white/20 bg-[#898989]/5 text-gray-300 hover:bg-gray-600/50"
                }`}
              >
                {option === "newest"
                  ? "Newest"
                  : option === "oldest"
                    ? "Oldest"
                    : "Most Upvotes"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="flex w-full animate-pulse flex-col gap-2 border border-white/20 bg-[#898989]/5 p-2">
              <div className="flex justify-between border-b border-white/20 px-2 py-1 pb-2">
                <span className="flex items-center gap-1">
                  <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm">
                    <UserIcon className="h-4 w-4" />
                  </span>{" "}
                  Loading user address...
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={true}
                    className={`flex items-center text-gray-300`}
                  >
                    <ChevronDoubleUpIcon className="h-5 w-5" />
                    <span>-</span>
                  </button>
                  <button
                    disabled={true}
                    className={`flex items-center text-gray-300`}
                  >
                    <ChevronDoubleDownIcon className="h-5 w-5" />
                    <span>-</span>
                  </button>
                </div>
              </div>
              <p className="p-2">Loading...</p>
            </div>
          </>
        ) : (
          <>
            {sortedComments.length ? (
              <div
                className={`flex max-h-[25vh] w-full flex-col gap-3 overflow-auto pb-3 ${sortedComments.length >= 3 && "pr-2"}`}
              >
                {sortedComments.map((comment) => {
                  const currentVote = Object.hasOwn(localVotes, comment.id)
                    ? localVotes[comment.id]
                    : userVotes?.[comment.id];

                  return (
                    <div
                      key={comment.id}
                      className="relative flex w-full flex-col gap-2 border border-white/20 bg-[#898989]/5 p-2 pb-4"
                    >
                      <div className="flex justify-between border-b border-white/20 px-2 py-1 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm">
                            <UserIcon className="h-4 w-4" />{" "}
                            {comment.userName && comment.userName}
                          </span>
                          {smallAddress(comment.userKey)}{" "}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleVote(comment.id, VoteType.UP)}
                            disabled={votingCommentId === comment.id}
                            className={`flex items-center ${currentVote === VoteType.UP ? "text-green-500" : ""}`}
                          >
                            <ChevronDoubleUpIcon className="h-5 w-5" />
                            <span>{comment.upvotes}</span>
                          </button>
                          <button
                            onClick={() =>
                              handleVote(comment.id, VoteType.DOWN)
                            }
                            disabled={votingCommentId === comment.id}
                            className={`flex items-center ${currentVote === VoteType.DOWN ? "text-red-500" : ""}`}
                          >
                            <ChevronDoubleDownIcon className="h-5 w-5" />
                            <span>{comment.downvotes}</span>
                          </button>
                        </div>
                      </div>
                      <p className="p-2">{comment.content}</p>
                      <div className="absolute bottom-2 right-2">
                        <ReportComment commentId={comment.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No comments yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
