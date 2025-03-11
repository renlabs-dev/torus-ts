import { STATUS_CONFIG } from "./get-submit-status";
import { Label } from "@torus-ts/ui/components/label";
import { cn } from "@torus-ts/ui/lib/utils";

export function StatusLabel({
  status,
}: {
  status: keyof typeof STATUS_CONFIG;
}) {
  const { message, color } = STATUS_CONFIG[status];

  return <Label className={cn("text-center text-sm", color)}>{message}</Label>;
}
