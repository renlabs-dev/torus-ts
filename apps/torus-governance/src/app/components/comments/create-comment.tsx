"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { formatToken } from "@torus-ts/utils";

import { api } from "~/trpc/react";
import { Button } from "@torus-ts/ui";

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
      await utils.proposalComment.byId.invalidate({ proposalId });

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
    <div className="flex-col items-center justify-between hidden text-white h-fit min-h-max animate-fade-down animate-delay-200 md:flex">
      <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2">
        <div className="w-full pb-1 mb-2">
          <h2 className="text-lg font-semibold text-start">Create a Comment</h2>
        </div>
        <div className="relative">
          <textarea
            placeholder="Type your message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-24 p-3 text-white border rounded-md resize-none placeholder:text-muted-foreground bg-card border-muted"
            maxLength={MAX_CHARACTERS}
          />
          <span className="absolute text-sm text-muted-foreground bottom-3 right-4">
            {remainingChars} characters left
          </span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 text-white border rounded-md bg-card placeholder:text-muted-foreground border-muted"
            maxLength={MAX_NAME_CHARACTERS}
          />
          <Button
            type="submit"
            variant="default"
            className="py-6 transition"
            disabled={
              isSubmitDisabled() ||
              CreateComment.isPending ||
              !selectedAccount?.address ||
              content.length === 0
            }
          >
            {CreateComment.isPending ? "Posting..." : "Post"}
          </Button>
        </div>

        {isSubmitDisabled() && !error && (
          <p className="mt-2 text-sm text-yellow-500">
            {!selectedAccount?.address
              ? "Please connect your wallet to submit a comment."
              : ModeType === "PROPOSAL"
                ? `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`
                : "Only Cadre members can submit comments in DAO Applications."}
          </p>
        )}
      </form>
    </div>
  );
}
