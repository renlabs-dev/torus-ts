"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

export function SkeletonAgentCardHeader() {
  return (
    <CardHeader className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
      <Skeleton className="aspect-square h-32 w-32 rounded-sm" />
      <div className="flex h-full w-full flex-col justify-between gap-3">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </CardHeader>
  );
}

export function SkeletonAgentCardContent() {
  return (
    <CardContent>
      <Skeleton className="h-px w-full" />
      <div className="mt-2 flex flex-col gap-2 pt-2">
        <Skeleton className="h-16 w-full" />
      </div>
    </CardContent>
  );
}

export function SkeletonAgentCardFooter() {
  return (
    <CardFooter className="flex w-full flex-col items-start gap-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-6 w-full" />
    </CardFooter>
  );
}

export function AgentItemSkeleton() {
  return (
    <Card className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition duration-300 hover:scale-[102%] hover:border-white hover:shadow-2xl">
      <SkeletonAgentCardHeader />
      <SkeletonAgentCardContent />
      <SkeletonAgentCardFooter />
    </Card>
  );
}

export function AgentItemSkeletonGrid() {
  return (
    <div className="animate-fade-up animate-delay-1000 grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <AgentItemSkeleton key={i} />
      ))}
    </div>
  );
}
