"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";

import type { TransactionResult } from "@torus-ts/ui/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Button,
  Card,
  CardHeader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TransactionStatus,
} from "@torus-ts/ui";

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
    "By default, your voting power is delegated to a validator. If you prefer to manage your own votes, become a power user.";

  return (
    <Card className="hidden animate-fade-down p-6 animate-delay-500 md:block">
      <CardHeader className="pl-0 pt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2">
              <h3>Vote power settings</h3>
              <Info size={16} />
            </TooltipTrigger>
            <TooltipContent className="max-w-72 border-muted text-muted-foreground">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <Button
        className="flex w-full items-center py-2.5 font-semibold transition duration-200"
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
