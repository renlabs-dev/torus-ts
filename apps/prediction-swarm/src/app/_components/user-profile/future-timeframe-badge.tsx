import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { Clock } from "lucide-react";

interface FutureTimeframeBadgeProps {
  reason: string;
}

export function FutureTimeframeBadge({ reason }: FutureTimeframeBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center text-purple-600">
            <Clock className="mr-1 h-3 w-3" />
            Future Timeframe
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 max-w-xs text-white">
          <p className="text-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
