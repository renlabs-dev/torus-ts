import { Badge } from "@torus-ts/ui/components/badge";
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
          <Badge
            variant="outline"
            className="flex items-center rounded-full border-cyan-600/20 text-cyan-600"
          >
            <Clock className="mr-1 h-3 w-3" />
            Future Timeframe
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 max-w-xs text-white">
          <p className="text-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
