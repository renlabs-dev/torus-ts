"use client";

import { Button } from "@torus-ts/ui/components/button";
import Link from "next/link";
import LightPillar from "./_components/bg";
import { SubmitProspectDialog } from "./_components/submit-prospect-dialog";
import { cinzelDecorative } from "./fonts";

export default function Page() {
  return (
    <main className="relative flex min-h-screen w-full items-center overflow-hidden">
      {/* Background */}
      <LightPillar
        topColor="#9f29ff"
        bottomColor="#ffc800"
        intensity={0.9}
        rotationSpeed={0.4}
        pillarWidth={1.5}
        pillarHeight={0.5}
        noiseIntensity={0.7}
        pillarRotation={296}
      />

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
            <Button asChild size="lg">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
            <SubmitProspectDialog />
          </div>
        </div>
      </div>
    </main>
  );
}
