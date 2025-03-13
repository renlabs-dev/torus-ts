import type { StatusConfig } from "./get-submit-status";
import { StatusLabel } from "./status-label";
import { WeightPowerLabel } from "./weight-power-label";
import { Button } from "@torus-ts/ui/components/button";
import { SheetTrigger } from "@torus-ts/ui/components/sheet";
import { LoaderCircle, PieChart } from "lucide-react";

interface MenuTriggerProps {
  selectedAccount: string | undefined;
  submitStatus: StatusConfig;
}

export function AllocationSheetTrigger(props: MenuTriggerProps) {
  return (
    <div className="fixed bottom-12 z-[50] flex w-full flex-col items-center justify-end marker:flex md:bottom-14">
      <div className="bg-accent flex items-center gap-6 rounded-full border p-2 pl-4">
        <WeightPowerLabel />
        <StatusLabel status={props.submitStatus} />
        <div className="flex items-center gap-2">
          <SheetTrigger asChild disabled={!props.selectedAccount}>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-full border border-cyan-400 bg-cyan-400/10 px-2 font-bold text-cyan-400 hover:bg-cyan-400/20 hover:text-cyan-300"
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
