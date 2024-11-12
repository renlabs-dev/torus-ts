"use client";

import { useMemo, useState } from "react";

import type { TransactionResult } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";

import { Info } from "lucide-react";
import { Button, Card, CardHeader, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TransactionStatus } from "@torus-ts/ui";

export function VotingPowerButton(): JSX.Element | null {
  const { selectedAccount, updateDelegatingVotingPower, notDelegatingVoting } =
    useTorus();

  const [votingStatus, setVotingStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  const isPowerUser = useMemo(() => {
    if (selectedAccount?.address && notDelegatingVoting) {
      const isUserPower = notDelegatingVoting.includes(selectedAccount.address);
      return isUserPower;
    }
    return false;
  }, [selectedAccount, notDelegatingVoting]);

  function handleCallback(callbackReturn: TransactionResult): void {
    setVotingStatus(callbackReturn);
  }

  if (!selectedAccount) {
    return (
      <button
        className="w-full py-1 font-semibold text-gray-500 transition duration-200 border border-gray-500 hover:border-gray-600 hover:bg-gray-500/10"
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
    "By default, your voting power is delegated to a validator. If you prefer to manage your own votes, become a power user.";

  return (
    <Card className="hidden p-6 border-muted animate-fade-down animate-delay-500 md:block">
      <CardHeader className="pt-0 pl-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex gap-2 items-center">
              <h3>Vote power settings</h3>
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent className="border-muted max-w-72 text-muted-foreground">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <Button
        className="w-full py-2.5 flex items-center font-semibold transition duration-200 rounded-lg"
        onClick={() => {
          handleVote();
        }}
        type="submit"
      >
        {isPowerUser
          ? "Enable vote power delegation"
          : "Click to Become a Power User"}
      </Button>

      {votingStatus.status && (
        <TransactionStatus
          status={votingStatus.status}
          message={votingStatus.message}
        />
      )}
    </Card>
  );
}
