"use client"
import { useCommune } from "@commune-ts/providers/use-commune";
import { ChevronDoubleUpIcon } from "@heroicons/react/16/solid";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";

interface VotePostProps {
  postId: string;
  className?: string;
  upvotes: number;
  downvotes: number;
}

export const VotePostButton = (post: VotePostProps) => {
  const { postId, className } = post;
  const { selectedAccount } = useCommune();

  const { data: postVotes, refetch: postVotesRefetch } = api.forum.getPostVotesByPostId.useQuery(
    { postId },
    { enabled: !!postId }
  );

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
      { upvotes: 0, downvotes: 0 }
    );
  }, [postVotes]);

  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [localDownvotes, setLocalDownvotes] = useState(0);

  useEffect(() => {
    setLocalUpvotes(upvotes);
    setLocalDownvotes(downvotes);
  }, [upvotes, downvotes]);

  const [localUserHadVote, setLocalUserHadVote] = useState<"UPVOTE" | "DOWNVOTE" | null>(null);

  const utils = api.useUtils();

  const {
    data: userVotes,
    refetch: refetchUserVotes,
  } = api.forum.getPostVotesByUserId.useQuery(
    { userKey: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount }
  );

  const VotePostMutation = api.forum.votePost.useMutation();
  const userHadVoted = useMemo(() => userVotes?.find((vote) => vote.postId === postId)?.voteType ?? null, [userVotes, postId]);

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
      <div className="ml-2 transition duration-700 animate-fade-down">
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

  console.log(localUserHadVote, 'localUserHadVote');

  return (
    <div className="w-fit p-4 ml-2 border border-white/20 bg-[#898989]/5 animate-fade-down transition duration-700">
      <div className="flex items-center justify-center w-full space-x-0 text-sm text-center border divide-x divide-white/10 border-white/10 lg:w-auto">
        <button
          onClick={() => handleVote("UPVOTE")}
          className={`flex gap-2 px-3 py-2 w-full items-center justify-center ${localUserHadVote === "UPVOTE" ? "bg-green-500/20 " : ""} ${className} pr-3`}
        >
          <ChevronDoubleUpIcon
            className={`${localUserHadVote === "UPVOTE" ? "fill-green-500" : "fill-white"
              }`}
            height={16}
          />
          <span className="text-green-500">{localUpvotes}</span>
        </button>

        <button
          onClick={() => handleVote("DOWNVOTE")}
          className={`flex gap-2 px-3 py-2 w-full items-center justify-center ${localUserHadVote === "DOWNVOTE" ? "bg-red-500/20 " : ""} ${className}`}
        >
          <ChevronDoubleUpIcon
            className={`rotate-180 ${localUserHadVote === "DOWNVOTE" ? "fill-red-500" : "fill-white"
              }`}
            height={16}
          />
          <span className="text-red-500">{localDownvotes}</span>
        </button>
      </div>
    </div>
  );
};