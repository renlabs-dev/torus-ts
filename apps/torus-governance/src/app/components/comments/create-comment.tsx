"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui";
import { formatToken, toNano } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CHARACTERS = 300;
const MAX_NAME_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 2000;

export function CreateComment({
  id,
  itemType,
}: {
  id: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
}) {
  const { selectedAccount, accountStakedBalance } = useGovernance();
  const { data: cadreUsers } = api.cadre.all.useQuery();

  const [content, setContent] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [remainingChars, setRemainingChars] = useState(MAX_CHARACTERS);
  const [userHasEnoughBalance, setUserHasEnoughBalance] = useState(false);

  const utils = api.useUtils();
  const CreateComment = api.comment.create.useMutation({
    onSuccess: () => {
      setContent("");
      setRemainingChars(MAX_CHARACTERS);
    },
    onError: (err) => {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message ?? "Invalid input");
      } else {
        toast.error(err.message);
      }
    },
  });

  const isUserCadre = useMemo(
    () => cadreUsers?.some((user) => user.userKey === selectedAccount?.address),
    [cadreUsers, selectedAccount],
  );

  useEffect(() => {
    setUserHasEnoughBalance(
      accountStakedBalance
        ? accountStakedBalance > toNano(MIN_STAKE_REQUIRED)
        : false,
    );
  }, [accountStakedBalance, selectedAccount]);

  useEffect(() => {
    setRemainingChars(MAX_CHARACTERS - content.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to submit a comment.");
      return;
    }

    if (itemType === "PROPOSAL") {
      if (userHasEnoughBalance) {
        toast.error(
          `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`,
        );
        return;
      }
    } else {
      if (
        !cadreUsers?.some((user) => user.userKey === selectedAccount.address)
      ) {
        toast.error(
          "Only Curator DAO members can submit comments in DAO mode.",
        );
        return;
      }
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
      return !cadreUsers?.some(
        (user) => user.userKey === selectedAccount.address,
      );
    }
  };

  const setBlur = () => {
    if (
      !selectedAccount ||
      (itemType === "PROPOSAL" && !userHasEnoughBalance) ||
      (itemType === "AGENT_APPLICATION" && !isUserCadre)
    ) {
      return true;
    }
    return false;
  };

  return (
    <div className="hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between text-white animate-delay-1000 md:flex">
      <div className="mb-2 w-full pb-1">
        <h2 className="text-start text-lg font-semibold">Create a Comment</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`flex w-full flex-col gap-2 ${setBlur() && "blur-md"}`}
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
      </form>
      {!selectedAccount?.address && itemType === "PROPOSAL" && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
          <p className="mt-2 text-center text-sm">
            Please connect your wallet to submit a comment.
          </p>
        </div>
      )}

      {!userHasEnoughBalance &&
        itemType === "PROPOSAL" &&
        selectedAccount?.address && (
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-sm">
              You need to have at least {MIN_STAKE_REQUIRED} TORUS total staked
              balance to submit a comment.
            </p>
          </div>
        )}
      {!selectedAccount && itemType === "AGENT_APPLICATION" && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
          <p className="mt-2 text-center text-sm">Are you a Curator DAO?</p>
          <p className="mt-2 text-center text-sm">
            Connect your wallet to comment.
          </p>
        </div>
      )}
      {selectedAccount && !isUserCadre && itemType === "AGENT_APPLICATION" && (
        <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center gap-0.5">
          <p className="mt-2 text-center text-sm">
            You must be a Curator DAO member to comment on agent applications.
          </p>
        </div>
      )}
    </div>
  );
}
