import { checkSS58 } from "@torus-network/sdk";
import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Label } from "@torus-ts/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { env } from "~/env";
import { useTutorialStore } from "~/stores/tutorialStore";
import { Info } from "lucide-react";
import { useMemo } from "react";

export function WeightPowerLabel() {
  const { openTutorial } = useTutorialStore();

  const { selectedAccount, api: torusApi } = useTorus();
  const { data: accountStakedBy, isLoading: isLoadingAccountStakedBy } =
    useKeyStakedBy(torusApi, env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"));

  const userWeightPower = useMemo(() => {
    if (isLoadingAccountStakedBy || !selectedAccount?.address) return null;

    if (!accountStakedBy) {
      return BigInt(0);
    }

    const stake = accountStakedBy.get(checkSS58(selectedAccount.address));

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, isLoadingAccountStakedBy, selectedAccount]);

  return (
    <Label className="flex items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-muted-foreground flex items-center gap-1.5 text-nowrap text-sm">
              <Info size={16} />
              Weight Power:
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px] space-y-3">
            <p className="">
              Your weight power is the amount of stake you have in the Allocator
              app.
            </p>
            <span>
              Check the{" "}
              <button onClick={openTutorial} className="underline">
                tutorial
              </button>{" "}
              to learn more about how to stake.
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {userWeightPower ?? <span className="animate-pulse">00,00.00</span>} TORUS
    </Label>
  );
}
