import { Label } from "@torus-ts/ui/components/label";
import { cn } from "@torus-ts/ui/lib/utils";
import { SquareCheckBig } from "lucide-react";
import type { StatusConfig } from "./get-submit-status";

export function StatusLabel({ status }: { status: StatusConfig }) {
  return (
    <Label
      className={cn(
        "flex items-center gap-2 text-center text-sm",
        status.color,
      )}
    >
      <SquareCheckBig size={16} /> {status.message}
    </Label>
  );
}
