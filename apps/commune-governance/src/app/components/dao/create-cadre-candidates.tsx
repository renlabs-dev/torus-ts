"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { z } from "zod";

import { useCommune } from "@commune-ts/providers/use-commune";
import { toast } from "@commune-ts/providers/use-toast";
import { formatToken } from "@commune-ts/utils";

import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 500;
const MIN_STAKE_REQUIRED = 5000;

export function CreateCadreCandidates() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [discordId, setDiscordId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CONTENT_CHARACTERS);

  const { selectedAccount, stakeOut } = useCommune();

  const { data: cadreUsers } = api.dao.byCadre.useQuery();
  const { data: cadreCandidates } = api.dao.byCadreCandidates.useQuery();

  let userStakeWeight: bigint | null = null;

  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const createCadreCandidateMutation = api.dao.addCadreCandidates.useMutation({
    onSuccess: () => {
      router.refresh();
      setDiscordId("");
      setContent("");
      setIsOpen(false);
      toast.success("Cadre candidate request submitted successfully!");
    },
    onError: (error) => {
      setError(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount?.address) {
      setError("Please connect your wallet to submit a request.");
      return;
    }

    if (
      !userStakeWeight ||
      Number(formatToken(userStakeWeight)) < MIN_STAKE_REQUIRED
    ) {
      setError(
        `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to apply.`,
      );
      return;
    }

    if (!cadreUsers?.some((user) => user.userKey === selectedAccount.address)) {
      setError("You already are a S2 DAO member.");
      return;
    }

    if (
      cadreCandidates?.some((user) => user.userKey === selectedAccount.address)
    ) {
      setError("You have already submitted a request to be a S2 DAO member.");
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
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between text-nowrap border py-2.5 pl-4 pr-2.5 font-semibold transition duration-200
          ${isOpen ? "border-teal-500 bg-teal-600/5 text-teal-500 hover:border-teal-400 hover:bg-teal-500/15 active:bg-teal-500/50" : "border-green-500 bg-green-600/5 text-green-500 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"}`}
      >
        Apply to be a S2 DAO Member
        <ChevronDownIcon
          className={`h-6 w-6 ${isOpen ? "rotate-180 transform" : ""}`}
        />
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Discord ID (e.g., 146386789998853569)"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            className="w-full bg-gray-600/10 p-3 text-white"
          />
          <div className="relative">
            <textarea
              placeholder="Why do you want to be a Cadre candidate?"
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
          <button
            type="submit"
            className="bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              createCadreCandidateMutation.isPending ||
              !selectedAccount?.address
            }
          >
            {createCadreCandidateMutation.isPending
              ? "Submitting..."
              : "Submit"}
          </button>
          {!selectedAccount?.address && (
            <p className="text-sm text-yellow-500">
              Please connect your wallet to submit a request.
            </p>
          )}
          <div className="mt-1 flex w-full border-t border-white/20 pt-3">
            <p className="text-sm">
              The S2 DAO Cadre is a group of community members who are
              responsible for voting on S2 Applications (Modules / Validators).
              If you are interested in joining the Cadre, please submit your
              application above.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
