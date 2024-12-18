"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";

import { api } from "~/trpc/react";

const MAX_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 5000;

export function CreateComment({ postId }: { postId: string }) {
  const router = useRouter();
  const { selectedAccount } = useTorus();

  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CHARACTERS);

  const utils = api.useUtils();
  const CreateComment = api.forum.createComment.useMutation({
    onSuccess: () => {
      router.refresh();
      setContent("");
      setRemainingChars(MAX_CHARACTERS);
    },
  });

  useEffect(() => {
    setRemainingChars(MAX_CHARACTERS - content.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount?.address) {
      setError("Please connect your wallet to submit a comment.");
      return;
    }

    try {
      // TODO: Validate if we need to check for the minimum balance required to comment
      await CreateComment.mutateAsync({
        content,
        postId: postId,
        userKey: selectedAccount.address,
      });
      toast.success("Comment submitted successfully!");
      await utils.forum.getCommentsByPost.invalidate({ postId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Invalid input");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const isSubmitDisabled = () => {
    if (CreateComment.isPending || !selectedAccount?.address) return true;
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <div className="mb-2 w-full border-b border-gray-500 border-white/20 pb-1 text-gray-400">
        <h2 className="text-start font-semibold">Create a Comment</h2>
      </div>
      <div className="relative">
        <textarea
          placeholder="Your comment here"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            console.log(e.target.value);
          }}
          className="h-24 w-full bg-gray-600/10 p-3 text-white"
          maxLength={MAX_CHARACTERS}
          rows={5}
        />
        <span className="absolute bottom-2 right-2 text-sm text-gray-400">
          {remainingChars} characters left
        </span>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        className="bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={
          isSubmitDisabled() ||
          CreateComment.isPending ||
          !selectedAccount?.address ||
          content.length === 0
        }
      >
        {CreateComment.isPending ? "Submitting..." : "Submit"}
      </button>
      {isSubmitDisabled() && !error && (
        <p className="text-sm text-yellow-500">
          {!selectedAccount?.address
            ? "Please connect your wallet to submit a comment."
            : `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`}
        </p>
      )}
    </form>
  );
}
