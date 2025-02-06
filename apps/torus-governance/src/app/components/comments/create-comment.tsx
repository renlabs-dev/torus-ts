"use client";

import { useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui";
import { formatToken, toNano } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import type { SS58Address } from "@torus-ts/subspace";

const MAX_CHARACTERS = 300;
const MAX_NAME_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 2000;

export function CreateComment({
  id,
  itemType,
  author,
}: {
  id: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
  author?: SS58Address;
}) {
  const { selectedAccount, accountStakedBalance, isUserCadre } =
    useGovernance();

  const [content, setContent] = useState<string>("");
  const [name, setName] = useState<string>("");
  const remainingChars = MAX_CHARACTERS - content.length;
  const userHasEnoughBalance = accountStakedBalance
    ? accountStakedBalance > toNano(MIN_STAKE_REQUIRED)
    : false;

  const utils = api.useUtils();
  const CreateComment = api.comment.create.useMutation({
    onSuccess: () => {
      setContent("");
    },
    onError: (err) => {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message ?? "Invalid input");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to submit a comment.");
      return;
    }

    if (itemType === "PROPOSAL" && !userHasEnoughBalance) {
      toast.error(
        `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`,
      );
      return;
    }

    if (
      itemType === "AGENT_APPLICATION" &&
      !isUserCadre &&
      author !== selectedAccount.address
    ) {
      toast.error("Only Curator DAO members can submit comments in DAO mode.");
      return;
    }

    try {
      await CreateComment.mutateAsync({
        content,
        itemId: id,
        itemType: itemType,
        userName: name || undefined,
      });
      toast.success("Comment submitted successfully!");
      await utils.comment.byId.invalidate({ proposalId: id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message ?? "Invalid input");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const isSubmitDisabled = () => {
    if (CreateComment.isPending || !selectedAccount?.address) return true;

    if (itemType === "PROPOSAL") {
      return (
        !accountStakedBalance ||
        Number(formatToken(accountStakedBalance)) < MIN_STAKE_REQUIRED
      );
    }
    {
      return !isUserCadre && author !== selectedAccount.address;
    }
  };

  const setOverlay = () => {
    if (!selectedAccount?.address) return true;
    if (itemType === "PROPOSAL" && !userHasEnoughBalance) return true;
    if (
      itemType === "AGENT_APPLICATION" &&
      !isUserCadre &&
      author !== selectedAccount.address
    )
      return true;
    return false;
  };

  return (
    <div className="hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between text-white animate-delay-200 md:flex">
      <div className="mb-2 w-full pb-1">
        <h2 className="text-start text-lg font-semibold">Create a Comment</h2>
      </div>
      <div className="relative w-full">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
          <div className="relative">
            <textarea
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-radius h-24 w-full resize-none border border-muted bg-card p-3 text-white placeholder:text-muted-foreground"
              maxLength={MAX_CHARACTERS}
            />
            <span className="absolute bottom-3 right-4 text-sm text-muted-foreground">
              {remainingChars} characters left
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-radius w-full border border-muted bg-card p-3 text-white placeholder:text-muted-foreground"
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
        </form>

        {setOverlay() && (
          <div className="absolute inset-0 z-10 bg-black bg-opacity-80"></div>
        )}

        {!selectedAccount?.address && itemType === "PROPOSAL" && (
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-lg">
              Please connect your wallet to submit a comment.
            </p>
          </div>
        )}

        {selectedAccount?.address &&
          !userHasEnoughBalance &&
          itemType === "PROPOSAL" && (
            <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
              <p className="mt-2 text-center text-lg">
                You need to have at least {MIN_STAKE_REQUIRED} TORUS total
                staked balance to submit a comment.
              </p>
            </div>
          )}

        {!selectedAccount?.address && itemType === "AGENT_APPLICATION" && (
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-sm">
              Are you a Curator DAO member?
            </p>
            <p className="mt-2 text-center text-sm">
              Please connect your wallet to comment.
            </p>
          </div>
        )}

        {selectedAccount &&
          !isUserCadre &&
          author !== selectedAccount.address &&
          itemType === "AGENT_APPLICATION" && (
            <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center gap-0.5">
              <p className="mt-2 text-center text-lg">
                You must be a Curator DAO member to comment on agent
                applications.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
