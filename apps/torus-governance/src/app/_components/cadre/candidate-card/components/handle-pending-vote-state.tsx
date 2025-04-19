"use client";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { HandleVoteLabel } from "./handle-vote-label";
import { useVoteManagement } from "../../../../../../hooks/use-vote-manager";

interface HandlePendingVoteStateProps {
  userKey: string;
  accept: number;
  refuse: number;
  isUserCadre: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
}

export function HandlePendingVoteState(props: HandlePendingVoteStateProps) {
  const {
    currentVote,
    isPending,
    pendingAction,
    handleVote,
    handleRemoveVote,
  } = useVoteManagement(props.userKey, props.selectedAccount?.address);

  const pendingVoteStateProps = {
    vote: currentVote ?? "",
    accept: props.accept,
    refuse: props.refuse,
  };

  if (currentVote === "ACCEPT" || currentVote === "REFUSE") {
    const voteLabel = currentVote === "ACCEPT" ? "in Favor" : "Against";
    return (
      <div className="flex flex-row flex-wrap gap-4">
        <HandleVoteLabel {...pendingVoteStateProps} />
        <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
          <Button
            onClick={handleRemoveVote}
            variant="destructive"
            className="flex w-full sm:w-auto"
            title="Reject"
          >
            {isPending ? "Please Sign" : `Revoke Vote ${voteLabel}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-wrap gap-4">
      <HandleVoteLabel {...pendingVoteStateProps} />
      <div
        className={cn(
          "flex w-full items-center justify-center gap-2 sm:w-auto",
          !props.isUserCadre && "cursor-not-allowed opacity-50",
        )}
      >
        <Button
          onClick={() => handleVote("REFUSE")}
          variant="outline"
          className="flex w-full border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500/30
            hover:text-red-500 sm:w-auto"
          title="Reject"
          disabled={isPending || !props.isUserCadre}
        >
          {isPending && pendingAction === "REFUSE" ? "Please Sign" : "Refuse"}
        </Button>
        <Button
          onClick={() => handleVote("ACCEPT")}
          variant="outline"
          className="flex w-full border-green-500 bg-green-500/20 text-green-500
            hover:bg-green-500/30 hover:text-green-500 sm:w-auto"
          title="Approve"
          disabled={isPending || !props.isUserCadre}
        >
          {isPending && pendingAction === "ACCEPT" ? "Please Sign" : "Accept"}
        </Button>
      </div>
    </div>
  );
}
