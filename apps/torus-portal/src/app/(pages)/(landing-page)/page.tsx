import Image from "next/image";
import * as React from "react";
import { Footer } from "./_components/footer";
import { HoverHeader } from "./_components/hover-header";
import { TorusAnimation } from "./_components/torus-animation";
import { ViewMore } from "./_components/view-more";

export async function generateMetadata() {
  return import("../layout").then((mod) => mod.generateMetadata());
}

export default function Page() {
  return (
    <main className="relative">
      <section className="relative min-h-screen">
        <HoverHeader />

        <div
          className="animate-fade animate-delay-700 absolute top-0 -z-40 h-full w-full"
          style={{ overflow: "hidden" }}
        >
          <TorusAnimation />
        </div>
        <div className="animate-fade z-20 flex min-h-screen w-full flex-col items-center justify-center">
          <Image
            priority
            alt="Torus"
            width={1000}
            height={1000}
            src="/asci-text.svg"
            className="animate-fade animate-delay-[1000ms] pointer-events-none hidden select-none px-6 md:block lg:w-[85vh]"
          />
        </div>
      </section>
      <ViewMore />
      <Footer />
    </main>
  );
}
