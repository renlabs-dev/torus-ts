import { Card } from "@torus-ts/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

export function FeedLegend() {
  return (
    <Card className="bg-background/80 plus-corners relative backdrop-blur-sm">
      <TooltipProvider>
        <div className="flex flex-col flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 text-sm sm:flex-row">
          {/* Details Menu */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <MoreVertical className="h-4 w-4" />
                <span className="text-muted-foreground text-xs">Details</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/80 text-white">
              <p className="max-w-xs text-xs">
                View technical details including prediction IDs, quality score,
                rationale, and version information.
              </p>
            </TooltipContent>
          </Tooltip>
          {/* Timeframe */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-blue-600" />
                <span className="text-muted-foreground text-xs">Timeframe</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/80 text-white">
              <p className="max-w-xs text-xs">
                Text in [blue brackets] indicates when the prediction is
                expected to occur or be verified.
              </p>
            </TooltipContent>
          </Tooltip>
          {/* Prediction Goal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <div className="bg-primary h-4 w-4 rounded" />
                <span className="text-muted-foreground text-xs">
                  Current prediction slice
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/80 text-white">
              <p className="max-w-xs text-xs">
                Highlighted portion of the tweet containing the prediction goal.
                This is the main claim being made by the predictor.
              </p>
            </TooltipContent>
          </Tooltip>
          {/* Other Predictions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-300/20" />
                <span className="text-muted-foreground text-xs">
                  Other predictions slices
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/80 text-white">
              <p className="max-w-xs text-xs">
                Gray highlighted areas show alternate predictions parsed from
                the same tweet. Use navigation arrows to view them.
              </p>
            </TooltipContent>
          </Tooltip>
          {/* Navigation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-2">
                <div className="flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" />
                  <span className="text-xs">1/3</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
                <span className="text-muted-foreground text-xs">
                  Navigate prediction slices
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-background/80 text-white">
              <p className="max-w-xs text-xs">
                When multiple predictions exist for a tweet, use these arrows to
                cycle through them. The counter shows current/total predictions.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </Card>
  );
}
