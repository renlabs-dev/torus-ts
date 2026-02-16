"use client";

import Link from "next/link";
import { RenaissanceButton } from "./_components/renaissance-button";
import { SubmitProspectDialog } from "./_components/submit-prospect-dialog";
import { cormorantGaramond } from "./fonts";

export default function Page() {
  return (
    <main className="relative flex min-h-screen w-full items-center overflow-hidden">
      {/* Content */}
      <div className="container relative z-10 mx-auto flex max-w-screen-2xl flex-col justify-center px-8 py-16">
        <div className="max-w-3xl">
          <h1
            className={`${cormorantGaramond.className} whitespace-nowrap text-[1.95rem] font-normal uppercase leading-[1.02] text-[#c5b89f] md:text-[2.6rem] lg:text-[3.25rem]`}
            style={{
              ...cormorantGaramond.style,
              fontKerning: "normal",
              textRendering: "optimizeLegibility",
              fontFeatureSettings: '"kern" 1, "liga" 1',
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
          >
            <span className="inline-block tracking-[0.3em]">APOSTLES</span>
            <span className="ml-[0.26em] inline-block tracking-[0.22em]">
              OF
            </span>
            <span className="ml-[0.3em] inline-block tracking-[0.3em]">
              TORUS
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-[1.58] text-[#b6aa95]">
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
