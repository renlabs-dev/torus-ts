import { Button } from "@torus-ts/ui/components/button";
import { SheetTrigger } from "@torus-ts/ui/components/sheet";
import { LoaderCircle, PieChart } from "lucide-react";
import type { StatusConfig } from "./get-submit-status";
import { SelectedAgentsLabel } from "./selected-agents-label";
import { StatusLabel } from "./status-label";
import { WeightPowerLabel } from "./weight-power-label";

interface MenuTriggerProps {
  selectedAccount: string | undefined;
  submitStatus: StatusConfig;
}

export function AllocationSheetTrigger(props: MenuTriggerProps) {
  return (
    <div
      className="animate-fade-up animate-delay-1000 fixed bottom-0 z-[50] flex w-full flex-col
        items-center justify-end marker:flex md:bottom-14"
    >
      <div
        className="to-accent flex w-full flex-col items-center gap-3 border-t border-white/20
          bg-gradient-to-bl from-zinc-900 p-2 pt-3 md:w-fit md:flex-row md:gap-6
          md:rounded-full md:border md:pl-4 md:pt-2"
      >
        <WeightPowerLabel />
        <SelectedAgentsLabel />
        <StatusLabel status={props.submitStatus} />
        <div className="flex w-full items-center gap-2 md:w-fit">
          <SheetTrigger asChild disabled={!props.selectedAccount}>
            <Button
              size="sm"
              variant="outline"
              className="w-full border border-green-500 bg-green-500/20 px-2 font-bold text-green-500
                hover:bg-green-500/30 hover:text-green-500 md:rounded-full"
            >
              {!props.selectedAccount ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <PieChart />
              )}
              Allocation Menu
            </Button>
          </SheetTrigger>
        </div>
      </div>
    </div>
  );
}
