import type { StatusConfig } from "./get-submit-status";
import { Label } from "@torus-ts/ui/components/label";
import { cn } from "@torus-ts/ui/lib/utils";

export function StatusLabel({ status }: { status: StatusConfig }) {
  return (
    <Label className={cn("text-center text-sm", status.color)}>
      {status.message}
    </Label>
  );
}
