"use client";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import { useVoteManagement } from "../../../../../../hooks/use-vote-manager";

interface HandleRemoveDaoMemberProps {
  userKey: string;
  revoke: number;
  selectedAccount: InjectedAccountWithMeta | null;
  isUserCadre: boolean;
}

export function HandleRemoveDaoMember(props: HandleRemoveDaoMemberProps) {
  const { currentVote, isPending, handleVote, handleRemoveVote } =
    useVoteManagement(props.userKey, props.selectedAccount?.address);

  // Only render the vote count text if there are votes
  const voteCountDisplay =
    props.revoke > 0 ? (
      <Label className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
        Remove vote count: <span className="text-red-500">{props.revoke}</span>
      </Label>
    ) : (
      // Empty space holder to keep alignment consistent
      <div className="min-w-[150px]"></div>
    );

  // User has already voted to remove
  if (currentVote === "REMOVE") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        {voteCountDisplay}
        <Button
          variant="outline"
          onClick={handleRemoveVote}
          type="button"
          className="flex w-full sm:w-auto"
          disabled={isPending || !props.isUserCadre}
        >
          {isPending ? "Please Sign" : "Revoke vote to remove"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {voteCountDisplay}
      <Button
        onClick={() => handleVote("REMOVE")}
        variant="destructive"
        className="flex w-full sm:w-auto"
        disabled={isPending || !props.isUserCadre}
      >
        {isPending ? "Please Sign" : "Remove Member"}
      </Button>
    </div>
  );
}
