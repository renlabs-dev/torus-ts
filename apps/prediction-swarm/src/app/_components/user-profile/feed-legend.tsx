import { Card } from "@torus-ts/ui/components/card";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

export function FeedLegend() {
  return (
    <Card className="bg-background/80 plus-corners relative backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 text-sm">
        {/* Prediction Goal */}
        <div className="flex items-center gap-2">
          <div className="bg-primary h-4 w-4 rounded" />
          <span className="text-muted-foreground text-xs">
            Current Prediction slice
          </span>
        </div>

        {/* Timeframe */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-blue-600" />
          <span className="text-muted-foreground text-xs">Timeframe</span>
        </div>

        {/* Other Predictions */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-300/20" />
          <span className="text-muted-foreground text-xs">
            Other Predictions slices
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" />
            <span className="text-xs">1/3</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <span className="text-muted-foreground text-xs">
            Navigate prediction slices
          </span>
        </div>

        {/* Details Menu */}
        <div className="flex items-center gap-2">
          <MoreVertical className="h-4 w-4" />
          <span className="text-muted-foreground text-xs">Extra details</span>
        </div>
      </div>
    </Card>
  );
}
