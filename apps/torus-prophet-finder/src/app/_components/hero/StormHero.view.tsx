"use client";

import * as React from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import StormQuad from "~/app/_components/hero/StormQuad.view";
import ScrollIndicator from "~/app/_components/hero/ScrollIndicator";
import StatsRow from "~/app/_components/hero/StatsRow";

export default function StormHero() {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "fadingIn" | "fadingOut">(
    "idle",
  );

  const handleScrollDown = React.useCallback(() => {
    if (isTransitioning) return; // ignore re-entrancy while animating
    setIsTransitioning(true);
    setPhase("fadingIn");
    setOverlayVisible(true); // black overlay fades in
  }, [isTransitioning]);

  return (
    <section className="relative w-full h-screen min-h-[540px] overflow-hidden">
      <Canvas className="absolute inset-0 z-0" dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <StormQuad />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto w-full">
        <h1 className="font-cinzel font-black leading-none text-white/95 whitespace-nowrap text-[clamp(2.5rem,10vw,9rem)] tracking-[0.06em] drop-shadow-[0_8px_36px_rgba(56,189,248,0.38)]">
          Prophet Finder
        </h1>
        <p className="mt-3 md:mt-4 max-w-3xl text-white/80 font-cinzel italic tracking-[0.08em] text-sm sm:text-base md:text-lg">
          THE MODERN INFORMATION LANDSCAPE IS A STORM. BECOME THE STORM RIDER.
          <br />
          BEHIND EVERY EVENT IS A PROPHET — THE SWARM FINDS THEM
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 sm:px-8">
          <StatsRow />
          <ScrollIndicator onClick={handleScrollDown} />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#050816] z-10" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-t from-transparent to-[#050816] z-10" />

      <div
        aria-hidden
        className={[
          "fixed inset-0 z-50 transition-opacity ease-in-out duration-300",
          overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        style={{ backgroundColor: "#000000", willChange: "opacity" }}
        onTransitionEnd={(e) => {
          if (e.propertyName !== "opacity") return;
          if (phase === "fadingIn") {
            const target = () => document.getElementById("content");
            // Jump instantly under cover, then hold black briefly so the reveal feels settled
            target()?.scrollIntoView({ behavior: "auto", block: "start" });
            window.setTimeout(() => {
              setPhase("fadingOut");
              setOverlayVisible(false);
            }, 300);
            return;
          }
          if (phase === "fadingOut") {
            setIsTransitioning(false);
            setPhase("idle");
          }
        }}
      />
    </section>
  );
}
