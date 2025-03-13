"use client";

import { Label } from "@torus-ts/ui/components/label";
import { Separator } from "@torus-ts/ui/components/separator";
import { Globe, Cuboid, IdCard } from "lucide-react";

export function AgentItemSkeleton() {
  return (
    <div className="bg-background group relative w-full border p-6">
      <div>
        <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
          <div className="-sm flex aspect-square h-full w-full animate-pulse items-center justify-center border bg-gray-500/10 shadow-xl md:h-32 md:w-32" />

          <div className="mt-1 flex h-full w-full flex-col justify-between gap-8">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="relative z-50 flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 w-4 animate-pulse rounded-full bg-gray-600"
                  />
                ))}
              </div>
            </div>
            <div className="h-6 w-3/4 animate-pulse bg-gray-600" />
            <div className="relative z-30 flex animate-pulse items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs">
                <Globe size={14} />
                <span>0%</span>
              </Label>

              <Label className="flex items-center gap-1.5 text-xs">
                <Cuboid size={16} />
                000000
              </Label>

              <div className="flex items-center gap-1.5 px-0 text-xs">
                <IdCard size={14} />
                000...000
              </div>
            </div>
          </div>
        </div>

        <Separator className="mt-4" />

        <div className="mt-4 flex flex-col gap-2">
          <div className="bg-background h-16" />

          <div>
            <Label className="absolute ml-2 mt-3 flex animate-pulse items-center gap-1.5 text-xs">
              Loading...
            </Label>
            <div className="bg-primary-foreground my-2 w-full border">
              <div
                className="animate-pulse bg-gray-600 py-3"
                style={{ width: "60%" }}
              />
            </div>
          </div>

          <div className="relative z-30 flex w-full flex-col gap-2 md:flex-row">
            <div className="h-8 w-full animate-pulse bg-gray-600" />
            <div className="h-8 w-14 animate-pulse bg-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
