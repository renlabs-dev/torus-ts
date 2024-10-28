"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { formatToken } from "@torus-ts/utils";

import { api } from "~/trpc/react";

const MAX_CHARACTERS = 300;
const MAX_NAME_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 5000;

export function CreateComment({
  proposalId,
  ModeType,
}: {
  proposalId: number;
  ModeType: "PROPOSAL" | "DAO";
}) {
  const { selectedAccount, stakeOut } = useTorus();
  const { data: cadreUsers } = api.dao.byCadre.useQuery();

  const [content, setContent] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CHARACTERS);

  let userStakeWeight: bigint | null = null;

  const utils = api.useUtils();
  const CreateComment = api.proposalComment.createComment.useMutation({
    onSuccess: () => {
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

    if (ModeType === "PROPOSAL") {
      if (
        !userStakeWeight ||
        Number(formatToken(userStakeWeight)) < MIN_STAKE_REQUIRED
      ) {
        setError(
          `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`,
        );
        return;
      }
    } else {
      if (
        !cadreUsers?.some((user) => user.userKey === selectedAccount.address)
      ) {
        setError("Only Cadre members can submit comments in DAO mode.");
        return;
      }
    }

    try {
      await CreateComment.mutateAsync({
        content,
        proposalId,
        governanceModel: ModeType,
        userName: name || undefined,
      });
      toast.success("Comment submitted successfully!");
      await utils.proposalComment.byId.invalidate({ proposalId: proposalId });

    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Invalid input");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const isSubmitDisabled = () => {
    if (CreateComment.isPending || !selectedAccount?.address) return true;

    if (ModeType === "PROPOSAL") {
      return (
        !userStakeWeight ||
        Number(formatToken(userStakeWeight)) < MIN_STAKE_REQUIRED
      );
    }
    {
      return !cadreUsers?.some(
        (user) => user.userKey === selectedAccount.address,
      );
    }
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
          onChange={(e) => setContent(e.target.value)}
          className="h-24 w-full resize-none bg-gray-600/10 p-3 text-white"
          maxLength={MAX_CHARACTERS}
        />
        <span className="absolute bottom-2 right-2 text-sm text-gray-400">
          {remainingChars} characters left
        </span>
      </div>
      <input
        type="text"
        placeholder="Your name here (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-2 w-full bg-gray-600/10 p-3 text-white"
        maxLength={MAX_NAME_CHARACTERS}
      />
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
            : ModeType === "PROPOSAL"
              ? `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`
              : "Only Cadre members can submit comments in DAO Applications."}
        </p>
      )}
    </form>
  );
}
