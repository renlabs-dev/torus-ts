import { Info } from "lucide-react";

import { Label } from "@torus-ts/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";

import { useUserWeightPower } from "~/hooks/use-user-weight-power";
import { useTutorialStore } from "~/stores/tutorialStore";

export function WeightPowerLabel() {
  const { openTutorial } = useTutorialStore();
  const { userWeightPower } = useUserWeightPower();

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
