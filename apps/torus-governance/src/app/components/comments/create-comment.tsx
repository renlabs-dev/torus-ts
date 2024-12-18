"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CHARACTERS = 300;
const MAX_NAME_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 5000;

export function CreateComment({
  id,
  ModeType,
}: {
  id: number;
  ModeType: "PROPOSAL" | "DAO";
}) {
  const { selectedAccount, accountStakedBalance } = useGovernance();
  const { data: cadreUsers } = api.dao.byCadre.useQuery();

  const [content, setContent] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CHARACTERS);

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
        !accountStakedBalance ||
        Number(formatToken(accountStakedBalance)) < MIN_STAKE_REQUIRED
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
        proposalId: id,
        governanceModel: ModeType,
        userName: name || undefined,
      });
      toast.success("Comment submitted successfully!");
      await utils.proposalComment.byId.invalidate({ proposalId: id });
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

    if (ModeType === "PROPOSAL") {
      return (
        !accountStakedBalance ||
        Number(formatToken(accountStakedBalance)) < MIN_STAKE_REQUIRED
      );
    }
    {
      return !cadreUsers?.some(
        (user) => user.userKey === selectedAccount.address,
      );
    }
  };

  return (
    <div className="hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between text-white animate-delay-200 md:flex">
      <div className="mb-2 w-full pb-1">
        <h2 className="text-start text-lg font-semibold">Create a Comment</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`flex w-full flex-col gap-2 ${!selectedAccount && "blur-sm"}`}
      >
        <div className="relative">
          <textarea
            placeholder="Type your message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-24 w-full resize-none rounded-md border border-muted bg-card p-3 text-white placeholder:text-muted-foreground"
            maxLength={MAX_CHARACTERS}
          />
          <span className="absolute bottom-3 right-4 text-sm text-muted-foreground">
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
            className="w-full rounded-md border border-muted bg-card p-3 text-white placeholder:text-muted-foreground"
            maxLength={MAX_NAME_CHARACTERS}
          />
          <Button
            type="submit"
            variant="outline"
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
      {!selectedAccount && (
        <div className="absolute inset-0 z-50 flex w-full items-center justify-center">
          <span>Connect your wallet to comment</span>
        </div>
      )}
    </div>
  );
}
