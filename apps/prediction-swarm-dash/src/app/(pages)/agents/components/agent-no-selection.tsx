"use client";

import { User } from "lucide-react";

export function AgentNoSelection() {
  return (
    <div className="h-full w-full">
      <div className="py-12 text-center">
        <User className="mx-auto mb-4 h-16 w-16 opacity-50" />
        <h3 className="mb-2 text-lg">Select an agent</h3>
        <p className="text-muted-foreground">
          Choose an agent from the field above to view detailed metrics and
          activity history.
        </p>
      </div>
    </div>
  );
}
