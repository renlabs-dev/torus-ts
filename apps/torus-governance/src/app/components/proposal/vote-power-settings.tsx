"use client";

import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useGovernance } from "~/context/governance-provider";
import { Info } from "lucide-react";
import { useState } from "react";

export function VotePowerSettings() {
  const { updateDelegatingVotingPower } = useTorus();
  const { accountsNotDelegatingVoting, isAccountPowerUser } = useGovernance();

  const [status, setStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleCallback(callbackReturn: TransactionResult): void {
    setStatus(callbackReturn);
  }

  function handleVote(): void {
    void updateDelegatingVotingPower({
      isDelegating: isAccountPowerUser,
      callback: handleCallback,
      refetchHandler: async () => {
        await accountsNotDelegatingVoting.refetch();
      },
    });
  }

  const tooltipText =
    "Validators handle voting by default. \nFor personal control, consider becoming a power user.";

  return (
    <Popover>
      <PopoverTrigger className="text-muted-foreground relative mt-2 flex items-center gap-2 hover:text-white hover:underline">
        <Info size={16} />
        <h3>Vote power settings</h3>
        {!isAccountPowerUser && (
          <>
            <span className="bg-muted absolute -right-2 top-0.5 h-1.5 w-1.5 rounded-full" />
            <span className="bg-muted-foreground animate-duration-[1500ms] absolute -right-2 top-0.5 h-1.5 w-1.5 animate-ping rounded-full" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="border-muted text-muted-foreground mb-4 flex max-w-72 flex-col gap-4">
        <span className="text-muted-foreground whitespace-break-spaces text-sm">
          {tooltipText}
        </span>

        <span className="text-sm">
          You're currently: <br />
          <span className="text-white">
            {isAccountPowerUser
              ? "a Power User."
              : "delegating your voting power."}
          </span>
        </span>
        <Button
          className="flex w-full items-center py-2.5 font-semibold transition duration-200"
          onClick={() => {
            handleVote();
          }}
          variant="outline"
        >
          {isAccountPowerUser ? "Delegate voting power" : "Become a Power User"}
        </Button>

        {status.status && (
          <TransactionStatus status={status.status} message={status.message} />
        )}
      </PopoverContent>
    </Popover>
  );
}
