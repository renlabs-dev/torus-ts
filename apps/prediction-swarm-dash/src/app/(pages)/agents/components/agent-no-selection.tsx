"use client";

import { User } from "lucide-react";

export function AgentNoSelection() {
  return (
    <div className="w-full">
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg mb-2">Select an agent</h3>
        <p className="text-muted-foreground">
          Choose an agent from the field above to view detailed metrics and
          activity history.
        </p>
      </div>
    </div>
  );
}
