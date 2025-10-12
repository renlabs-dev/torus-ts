"use client";

import { CardDescription } from "@torus-ts/ui/components/card";
import { BarChart3, Plus } from "lucide-react";

export function ComparisonEmpty() {
  return (
    <div className="flex w-full flex-col items-center justify-center py-12">
      <div className="mb-4 flex items-center gap-3">
        <BarChart3 className="text-muted-foreground h-12 w-12" />
        <Plus className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="mb-2 text-lg font-semibold">Select more agents</div>
      <CardDescription className="max-w-md text-center">
        Select at least 2 agents from the dropdown above to start comparing
        their performance metrics and activity data.
      </CardDescription>
    </div>
  );
}
