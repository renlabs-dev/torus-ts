import React from "react";
import { Card } from "@torus-ts/ui";

export function WalletSkeletonLoader() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="h-9 w-full animate-pulse rounded bg-accent" />

      <Card className="w-full animate-pulse p-6">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-16 rounded bg-accent" />
            <div className="h-10 w-full rounded bg-accent" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-20 rounded bg-accent" />
            <div className="flex w-full items-center gap-2">
              <div className="h-10 w-full rounded bg-accent" />
              <div className="flex w-2/5 gap-2">
                <div className="h-10 w-1/4 rounded bg-accent" />
                <div className="h-10 w-1/4 rounded bg-accent" />
                <div className="h-10 w-1/4 rounded bg-accent" />
                <div className="h-10 w-1/4 rounded bg-accent" />
              </div>
            </div>
          </div>
          <div className="h-6 w-2/5 rounded bg-accent" />
          <div className="h-10 w-full rounded bg-accent" />
        </div>
      </Card>
    </div>
  );
}
