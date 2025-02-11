import { Card } from "@torus-ts/ui";
import React from "react";

export function WalletSkeletonLoader() {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-pulse p-6 md:w-3/5">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-16 rounded bg-accent" />
            <div className="h-10 w-full rounded bg-accent" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-20 rounded bg-accent" />
            <div className="h-10 w-full rounded bg-accent" />
            <div className="flex gap-2">
              <div className="h-8 w-1/4 rounded bg-accent" />
              <div className="h-8 w-1/4 rounded bg-accent" />
              <div className="h-8 w-1/4 rounded bg-accent" />
            </div>
          </div>
          <div className="h-6 w-32 rounded bg-accent" />
        </div>
      </Card>
      <Card className="w-full animate-pulse p-6 md:w-2/5">
        <div className="flex flex-col gap-4">
          <div className="h-6 w-32 rounded bg-accent" />
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between">
                <div className="h-4 w-16 rounded bg-accent" />
                <div className="h-4 w-24 rounded bg-accent" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-10 w-full rounded bg-accent" />
        </div>
      </Card>
    </div>
  );
}
