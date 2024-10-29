"use client";

import { useEffect, useState } from "react";

import type { TransactionResult } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";

import { SectionHeaderText } from "../section-header-text";
import { Info, LoaderCircle } from "lucide-react";

export function VotingPowerButton(): JSX.Element | null {
  const { selectedAccount, updateDelegatingVotingPower, notDelegatingVoting } =
    useTorus();

  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  const [isPowerUser, setIsPowerUser] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (selectedAccount?.address && notDelegatingVoting) {
      const isUserPower = notDelegatingVoting.includes(selectedAccount.address);
      setIsPowerUser(isUserPower);
    }
  }, [selectedAccount, notDelegatingVoting]);

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
  }

  if (!selectedAccount) {
    return (
      <button
        className="w-full border border-gray-500 py-1 font-semibold text-gray-500 transition duration-200 hover:border-gray-600 hover:bg-gray-500/10"
        disabled={true}
      >
        Add wallet to Become a Power User
      </button>
    );
  }

  function handleVote(): void {
    void updateDelegatingVotingPower({
      isDelegating: isPowerUser,
      callback: handleCallback,
    });
  }

  const tooltipText =
    "By default, your voting power is delegated to a validator. If you're not a validator and prefer to manage your own votes, click here!";

  return (
    <div>
      <SectionHeaderText text="Vote power settings" />
      <div className="flex w-full flex-row items-center justify-center gap-3">
        <button
          className="w-11/12 border border-green-500 bg-green-600/5 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15"
          onClick={() => {
            handleVote();
          }}
          type="submit"
        >
          {isPowerUser
            ? "Enable vote power delegation"
            : "Click to Become a Power User"}
        </button>
        <div className="relative w-1/12">
          <button
            onClick={() => {
              setShowTooltip(!showTooltip);
            }}
            onMouseEnter={() => {
              setShowTooltip(true);
            }}
            onMouseLeave={() => {
              setShowTooltip(false);
            }}
            type="button"
          >
            <Info className="h-7 w-7 pt-1.5 text-green-500" />
          </button>
          {showTooltip ? (
            <div className="absolute bottom-10 right-0 w-64 border border-white/20 bg-black/80 p-3 text-sm text-gray-200 shadow-lg backdrop-blur-md">
              {tooltipText}
            </div>
          ) : null}
        </div>
      </div>
      {votingStatus.status ? (
        <p
          className={`${votingStatus.status === "PENDING" && "text-yellow-300"} ${votingStatus.status === "ERROR" && "text-red-300"} ${votingStatus.status === "SUCCESS" && "text-green-300"} flex text-left text-base`}
        >
          {votingStatus.message}
          {votingStatus.status === "PENDING" && (
            <LoaderCircle className="ml-2 animate-spin" width={16} />
          )}
        </p>
      ) : null}
    </div>
  );
}
