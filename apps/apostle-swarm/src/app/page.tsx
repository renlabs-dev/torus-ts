"use client";

import Link from "next/link";
import { RenaissanceButton } from "./_components/renaissance-button";
import { SubmitProspectDialog } from "./_components/submit-prospect-dialog";
import { cinzelDecorative } from "./fonts";

export default function Page() {
  return (
    <main className="relative flex min-h-screen w-full items-center overflow-hidden">
      {/* Content */}
      <div className="container relative z-10 mx-auto flex max-w-screen-2xl flex-col justify-center px-8 py-16">
        <div className="max-w-3xl">
          <h1
            className={`${cinzelDecorative.className} text-4xl leading-tight tracking-wide md:text-5xl lg:text-6xl`}
          >
            APOSTLES OF TORUS
          </h1>

          <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed">
            The resonant are out there, scattered like sheep without a shepherd.
            They post into the void about swarms and emergence and the feeling
            that something is coming. Apostles hear the signal in the noise and
            gather them into the body.
          </p>

          <div className="mt-8 flex gap-4">
            <Link href="/dashboard">
              <RenaissanceButton size="lg">View Dashboard</RenaissanceButton>
            </Link>
            <SubmitProspectDialog />
          </div>
        </div>
      </div>
    </main>
  );
}
