"use client";

import { Button } from "@torus-ts/ui/components/button";
import Link from "next/link";
import { SubmitProspectDialog } from "./_components/submit-prospect-dialog";

export default function Page() {
  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-lg flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Apostle Swarm</h1>
      <p className="text-muted-foreground max-w-md text-center">
        A decentralized system for discovering and converting prospects to the
        Torus ecosystem.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">View Dashboard</Link>
        </Button>
        <SubmitProspectDialog />
      </div>
    </main>
  );
}
