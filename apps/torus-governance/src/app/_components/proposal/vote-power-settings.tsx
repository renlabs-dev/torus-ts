"use client";

import {
  disableVoteDelegation,
  enableVoteDelegation,
} from "@torus-network/sdk/chain";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { useGovernance } from "~/context/governance-provider";
import { Info } from "lucide-react";

export function VotePowerSettings() {
  const { api, selectedAccount, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Update Vote Delegation",
  });
  const { accountsNotDelegatingVoting, isAccountPowerUser } = useGovernance();

  async function handleVote(): Promise<void> {
    if (!api || !sendTx) return;

    const transaction = isAccountPowerUser
      ? enableVoteDelegation(api)
      : disableVoteDelegation(api);

    const [sendErr, sendRes] = await sendTx(transaction);

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      void accountsNotDelegatingVoting.refetch();
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
            void handleVote();
          }}
          variant="outline"
          disabled={isPending || isSigning}
        >
          {isAccountPowerUser ? "Delegate voting power" : "Become a Power User"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
