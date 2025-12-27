"use client";

import { SubmitProspectDialog } from "./_components/submit-prospect-dialog";

export default function Page() {
  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-lg flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Apostle Swarm</h1>
      <SubmitProspectDialog />
    </main>
  );
}
