"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

export default function AgentLoading() {
  return (
    <Container>
      <div className="animate-fade-up mx-auto pb-16 text-white">
        <Link
          href="/"
          className="animate-fade-left mb-4 flex w-fit items-center gap-1.5 text-white transition
            duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents list
        </Link>

        <div className="mb-12 flex flex-col gap-6 md:flex-row">
          <div className="mb-12 flex flex-col gap-6 md:w-2/3">
            <Card className="mb-6 flex flex-col gap-6 md:flex-row">
              <Skeleton className="aspect-square h-48 w-48 rounded-sm" />
              <div className="flex w-fit flex-col gap-6 p-6 md:p-0 md:pt-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>

            <Skeleton className="h-64 w-full" />
          </div>
          <div className="flex flex-col gap-6 md:w-1/3">
            <Card className="p-6">
              <Skeleton className="mb-3 h-6 w-48" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-2 h-4 w-full" />
            </Card>

            <Card className="flex items-center justify-between p-6">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </Card>

            <Card className="p-6">
              <Skeleton className="mb-3 h-6 w-full" />
              <Skeleton className="h-3 w-full rounded-md" />
            </Card>

            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </Container>
  );
}
