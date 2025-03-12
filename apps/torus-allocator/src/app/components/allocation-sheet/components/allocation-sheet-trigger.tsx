import type { StatusConfig } from "./get-submit-status";
import { StatusLabel } from "./status-label";
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
      <div className="bg-accent flex items-center gap-3 rounded-full border p-3">
        <StatusLabel status={props.submitStatus} />
        <div className="flex items-center gap-2">
          <SheetTrigger asChild disabled={!props.selectedAccount}>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-full border border-cyan-500 bg-cyan-500/10 px-2 text-cyan-500"
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
