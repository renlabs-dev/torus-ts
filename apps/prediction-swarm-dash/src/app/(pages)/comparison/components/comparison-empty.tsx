"use client";

import { BarChart3, Plus } from "lucide-react";
import { CardDescription } from "@torus-ts/ui/components/card";

export function ComparisonEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 w-full">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-lg font-semibold mb-2">Select more agents</div>
      <CardDescription className="text-center max-w-md">
        Select at least 2 agents from the dropdown above to start comparing
        their performance metrics and activity data.
      </CardDescription>
    </div>
  );
}
