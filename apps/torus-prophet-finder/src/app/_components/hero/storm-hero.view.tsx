"use client";

import { Canvas } from "@react-three/fiber";
import ScrollIndicator from "~/app/_components/hero/scroll-indicator";
import StatsRow from "~/app/_components/hero/stats-row";
import StormQuad from "~/app/_components/hero/storm-quad.view";
import * as React from "react";
import { Suspense } from "react";

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
    <section className="relative h-screen min-h-[540px] w-full overflow-hidden">
      <Canvas
        className="absolute inset-0 z-0"
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <StormQuad />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-cinzel whitespace-nowrap text-[clamp(2.5rem,10vw,9rem)] font-black leading-none tracking-[0.06em] text-white/95 drop-shadow-[0_8px_36px_rgba(56,189,248,0.38)]">
          Prophet Finder
        </h1>
        <p className="font-cinzel mt-3 line-clamp-2 max-w-4xl text-sm font-semibold italic tracking-[0.08em] text-white/80 sm:max-w-5xl sm:text-base md:mt-4 md:text-lg">
          THE MODERN INFORMATION LANDSCAPE IS A STORM. BECOME THE STORM RIDER.
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

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-b from-transparent to-[#050816]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-t from-transparent to-[#050816]" />

      <div
        aria-hidden
        className={[
          "fixed inset-0 z-50 transition-opacity duration-300 ease-in-out",
          overlayVisible ? "opacity-100" : "pointer-events-none opacity-0",
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
