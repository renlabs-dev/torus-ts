import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { checkSS58 } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Label } from "@torus-ts/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { formatToken } from "@torus-ts/utils/subspace";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { env } from "~/env";
import { useTutorialStore } from "~/stores/tutorialStore";

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
      {userWeightPower === null ? (
        <div className="flex items-center">
          <span className="animate-pulse text-gray-400">00.00</span>
          <span className="ml-0.5 text-xs">TORUS</span>
        </div>
      ) : (
        <span>
          {userWeightPower}
          <span className="ml-0.5 text-xs">TORUS</span>
        </span>
      )}
    </Label>
  );
}
