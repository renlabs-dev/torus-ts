"use client";

import { Skeleton } from "@torus-ts/ui/components/skeleton";

export function AgentItemSkeleton() {
  return (
    <div className="to-background animate-fade-up animate-delay-200 group relative border bg-gradient-to-tr from-zinc-900 p-6 transition duration-300">
      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
        <Skeleton className="aspect-square h-32 w-32 rounded-sm" />
        <div className="mt-1 flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-4 h-px w-full" /> {/* Separator */}
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-16 w-full" /> {/* Description */}
        <div className="mt-4">
          <Skeleton className="mb-3 h-4 w-48" /> {/* Label */}
          <Skeleton className="mt-6 h-6 w-full" /> {/* Slider */}
        </div>
      </div>
    </div>
  );
}
