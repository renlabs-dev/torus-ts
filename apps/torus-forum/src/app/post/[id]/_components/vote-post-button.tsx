"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsUp } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";

import { api } from "~/trpc/react";

interface VotePostProps {
  postId: string;
  className?: string;
  upvotes: number;
  downvotes: number;
}

export const VotePostButton = (post: VotePostProps) => {
  const { postId, className } = post;
  const { selectedAccount } = useTorus();

  const { data: postVotes, refetch: postVotesRefetch } =
    api.forum.getPostVotesByPostId.useQuery({ postId }, { enabled: !!postId });

  const { upvotes, downvotes } = useMemo(() => {
    if (!postVotes) return { upvotes: 0, downvotes: 0 };

    return postVotes.reduce(
      (acc, vote) => {
        if (vote.voteType === "UPVOTE") {
          acc.upvotes++;
        } else {
          acc.downvotes++;
        }
        return acc;
      },
      { upvotes: 0, downvotes: 0 },
    );
  }, [postVotes]);

  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [localDownvotes, setLocalDownvotes] = useState(0);

  useEffect(() => {
    setLocalUpvotes(upvotes);
    setLocalDownvotes(downvotes);
  }, [upvotes, downvotes]);

  const [localUserHadVote, setLocalUserHadVote] = useState<
    "UPVOTE" | "DOWNVOTE" | null
  >(null);

  const utils = api.useUtils();

  const { data: userVotes, refetch: refetchUserVotes } =
    api.forum.getPostVotesByUserId.useQuery(
      { userKey: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount },
    );

  const VotePostMutation = api.forum.votePost.useMutation();
  const userHadVoted = useMemo(
    () => userVotes?.find((vote) => vote.postId === postId)?.voteType ?? null,
    [userVotes, postId],
  );

  useEffect(() => {
    setLocalUserHadVote(userHadVoted);
  }, [userHadVoted]);

  const adjustVoteCount = (type: "UPVOTE" | "DOWNVOTE", delta: number) => {
    if (type === "UPVOTE") {
      setLocalUpvotes((prev) => prev + delta);
    } else {
      setLocalDownvotes((prev) => prev + delta);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="ml-2 animate-fade-down transition duration-700">
        <p>Sign in with your wallet to vote</p>
      </div>
    );
  }

  const handleVote = async (voteType: "DOWNVOTE" | "UPVOTE") => {
    try {
      await VotePostMutation.mutateAsync({
        postId,
        voteType,
        userKey: selectedAccount.address,
      });

      if (localUserHadVote === voteType) {
        // User is unvoting (removing their vote)
        adjustVoteCount(voteType, -1);
        setLocalUserHadVote(null);
      } else {
        // User is voting or changing their vote
        if (localUserHadVote) {
          // Decrease count for previous vote
          adjustVoteCount(localUserHadVote, -1);
        }
        // Increase count for new vote
        adjustVoteCount(voteType, +1);
        setLocalUserHadVote(voteType);
      }

      await postVotesRefetch();
      await refetchUserVotes();
      await utils.forum.all.invalidate();
    } catch (error) {
      console.error("Failed to create vote:", error);
    }
  };

  console.log(localUserHadVote, "localUserHadVote");

  return (
    <div className="ml-2 w-fit animate-fade-down border border-white/20 bg-[#898989]/5 p-4 transition duration-700">
      <div className="flex w-full items-center justify-center space-x-0 divide-x divide-white/10 border border-white/10 text-center text-sm lg:w-auto">
        <button
          onClick={() => handleVote("UPVOTE")}
          className={`flex w-full items-center justify-center gap-2 px-3 py-2 ${localUserHadVote === "UPVOTE" ? "bg-green-500/20" : ""} ${className} pr-3`}
        >
          <ChevronsUp
            className={`${
              localUserHadVote === "UPVOTE" ? "fill-green-500" : "fill-white"
            }`}
            height={16}
          />
          <span className="text-green-500">{localUpvotes}</span>
        </button>

        <button
          onClick={() => handleVote("DOWNVOTE")}
          className={`flex w-full items-center justify-center gap-2 px-3 py-2 ${localUserHadVote === "DOWNVOTE" ? "bg-red-500/20" : ""} ${className}`}
        >
          <ChevronsUp
            className={`rotate-180 ${
              localUserHadVote === "DOWNVOTE" ? "fill-red-500" : "fill-white"
            }`}
            height={16}
          />
          <span className="text-red-500">{localDownvotes}</span>
        </button>
      </div>
    </div>
  );
};
