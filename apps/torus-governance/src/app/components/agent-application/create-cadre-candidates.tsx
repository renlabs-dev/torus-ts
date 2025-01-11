"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 500;
const MIN_STAKE_REQUIRED = 5000;

export function CreateCadreCandidates() {
  const router = useRouter();
  const [discordId, setDiscordId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CONTENT_CHARACTERS);

  const { selectedAccount, accountStakedBalance } = useGovernance();

  const { data: cadreUsers } = api.cadre.all.useQuery();
  const { data: cadreCandidates } = api.cadreCandate.all.useQuery();

  const createCadreCandidateMutation = api.cadreCandate.create.useMutation({
    onSuccess: () => {
      router.refresh();
      setDiscordId("");
      setContent("");
      toast.success("Cadre candidate request submitted successfully!");
    },
    onError: (error) => {
      setError(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const isUserCadre = useMemo(
    () => cadreUsers?.some((user) => user.userKey === selectedAccount?.address),
    [cadreUsers, selectedAccount],
  );

  const isUserCadreCandidate = useMemo(
    () =>
      cadreCandidates?.some(
        (user) => user.userKey === selectedAccount?.address,
      ),
    [selectedAccount, cadreCandidates],
  );

  if (isUserCadre) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount?.address) {
      setError("Please connect your wallet to submit a request.");
      return;
    }

    if (
      !accountStakedBalance ||
      Number(formatToken(accountStakedBalance)) < MIN_STAKE_REQUIRED
    ) {
      setError(
        `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to apply.`,
      );
      return;
    }

    if (isUserCadreCandidate) {
      setError("You have already submitted a request to be a Cadre member.");
      return;
    }

    try {
      createCadreCandidateMutation.mutate({
        discordId,
        content,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Invalid input");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setRemainingChars(MAX_CONTENT_CHARACTERS - newContent.length);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="animate-fade-down animate-delay-[1400ms]"
        >
          Apply to join the Curator DAO
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mt-2 hidden w-[25em] md:block xl:mr-0">
        <div className="mt-1 flex w-full border-b border-white/20 pb-3">
          <p className="text-sm">
            The Curator DAO votes on agent/module applications. Interested in
            joining? Apply below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Discord ID (e.g., 146386789998853569)"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            minLength={17}
            className="w-full bg-gray-600/10 p-3 text-white"
          />
          <div className="relative">
            <Textarea
              placeholder="Why do you want to join the Curator DAO?"
              value={content}
              onChange={handleContentChange}
              className="h-32 w-full resize-none bg-gray-600/10 p-3 text-white"
              maxLength={MAX_CONTENT_CHARACTERS}
            />
            <span className="absolute bottom-2 right-2 text-sm text-gray-400">
              {remainingChars} characters left
            </span>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            variant={"default"}
            disabled={
              createCadreCandidateMutation.isPending ||
              !selectedAccount?.address
            }
          >
            {createCadreCandidateMutation.isPending
              ? "Submitting..."
              : "Submit"}
          </Button>
          {!selectedAccount?.address && (
            <p className="text-sm text-yellow-500">
              Please connect your wallet to submit a request.
            </p>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
