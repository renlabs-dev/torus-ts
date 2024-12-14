"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TransactionStatus,
} from "@torus-ts/ui";

export function VotePowerSettings(props: {
  isPowerUser: boolean;
}): JSX.Element | null {
  const { isPowerUser } = props;
  const { updateDelegatingVotingPower } = useTorus();

  const [status, setStatus] = useState<TransactionResult>({
    status: null,
    finalized: false,
    message: null,
  });

  function handleCallback(callbackReturn: TransactionResult): void {
    setStatus(callbackReturn);
    console.log(callbackReturn);
    if (callbackReturn.status === "SUCCESS" && callbackReturn.finalized) {
      // TODO: WE SHOULD BE ABLE TO CHANGE THE VOTE POWER SETTING STATE BY REFETCHING THE QUERY
      toast.success("This page will reload in 5 seconds");
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  function handleVote(): void {
    void updateDelegatingVotingPower({
      isDelegating: isPowerUser,
      callback: handleCallback,
    });
  }

  const tooltipText =
    "Validators handle voting by default. \nFor personal control, consider becoming a power user.";

  return (
    <Popover>
      <PopoverTrigger className="relative flex items-center gap-2 text-muted-foreground hover:text-white hover:underline">
        <Info size={16} />
        <h3>Vote power settings</h3>
        {!isPowerUser && (
          <>
            <span className="absolute -right-2 top-0.5 h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="absolute -right-2 top-0.5 h-1.5 w-1.5 animate-ping rounded-full bg-muted-foreground animate-duration-[1500ms]" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="mr-6 flex max-w-72 flex-col gap-4 border-muted text-muted-foreground">
        <span className="whitespace-break-spaces text-sm text-muted-foreground">
          {tooltipText}
        </span>

        <span className="text-sm">
          You're currently: <br />
          <span className="text-white">
            {isPowerUser ? "a Power User." : "delegating your voting power."}
          </span>
        </span>
        <Button
          className="flex w-full items-center py-2.5 font-semibold transition duration-200"
          onClick={() => {
            handleVote();
          }}
          variant="outline"
        >
          {isPowerUser ? "Delegate voting power" : "Become a Power User"}
        </Button>

        {status.status && (
          <TransactionStatus status={status.status} message={status.message} />
        )}
      </PopoverContent>
    </Popover>
  );
}
