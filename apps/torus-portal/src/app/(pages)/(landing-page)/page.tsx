import Image from "next/image";
import * as React from "react";
import { Footer } from "./_components/footer";
import { HoverHeader } from "./_components/hover-header";
import { LandingSidebar } from "./_components/landing-sidebar";
import { LandingSidebarProvider } from "./_components/landing-sidebar-context";
import { TorusAnimation } from "./_components/torus-animation";
import { ViewMore } from "./_components/view-more";

export async function generateMetadata() {
  return import("../portal/layout").then((mod) => mod.generateMetadata());
}

export default function Page() {
  return (
    <LandingSidebarProvider>
      <main className="relative">
        <LandingSidebar />
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
    </LandingSidebarProvider>
  );
}
