import { Card } from "@torus-ts/ui/components/card";
import React from "react";

export function WalletSkeletonLoader() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-accent h-9 w-full animate-pulse rounded" />

      <Card className="w-full animate-pulse p-6">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="bg-accent h-6 w-16 rounded" />
            <div className="bg-accent h-10 w-full rounded" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-accent h-6 w-20 rounded" />
            <div className="flex w-full items-center gap-2">
              <div className="bg-accent h-10 w-full rounded" />
              <div className="flex w-2/5 gap-2">
                <div className="bg-accent h-10 w-1/4 rounded" />
                <div className="bg-accent h-10 w-1/4 rounded" />
                <div className="bg-accent h-10 w-1/4 rounded" />
                <div className="bg-accent h-10 w-1/4 rounded" />
              </div>
            </div>
          </div>
          <div className="bg-accent h-6 w-2/5 rounded" />
          <div className="bg-accent h-10 w-full rounded" />
        </div>
      </Card>
    </div>
  );
}
