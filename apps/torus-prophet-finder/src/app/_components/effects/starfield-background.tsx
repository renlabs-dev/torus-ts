"use client";

import * as React from "react";

interface Star {
  top: number;
  left: number;
}

function pct(n: number): string {
  return `${n.toFixed(4)}%`;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return function next() {
    // Mulberry32 PRNG
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useStars(count: number, seed: number): Star[] {
  return React.useMemo(() => {
    const rng = createRng(seed);
    const out: Star[] = [];
    for (let i = 0; i < count; i++) {
      out.push({ top: rng() * 100, left: rng() * 100 });
    }
    return out;
  }, [count, seed]);
}

function StarsPanel({ stars, size }: { stars: Star[]; size: number }) {
  return (
    <div className="relative h-1/2 w-full">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: pct(s.top),
            left: pct(s.left),
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      ))}
    </div>
  );
}

function ScrollingStars({
  count,
  size,
  durationSec,
  seed,
}: {
  count: number;
  size: number;
  durationSec: number;
  seed: number;
}) {
  const stars = useStars(count, seed);
  const style = { ["--sf-dur" as const]: `${durationSec}s` };
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="relative h-[200%] w-full will-change-transform"
        style={{
          ...style,
          animation: "sf-scroll var(--sf-dur) linear infinite",
        }}
      >
        <StarsPanel stars={stars} size={size} />
        <StarsPanel stars={stars} size={size} />
      </div>
    </div>
  );
}

function TwinkleStars({
  count,
  size,
  seed,
  minDelay = 0,
  maxDelay = 2,
}: {
  count: number;
  size: number;
  seed: number;
  minDelay?: number;
  maxDelay?: number;
}) {
  const stars = useStars(count, seed);
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => {
        // Deterministic, SSR-safe delay from index (golden ratio spacing)
        const span = Math.max(0, maxDelay - minDelay);
        const delay = minDelay + ((i * 0.61803398875) % 1) * span;
        return (
          <div
            key={i}
            className="absolute animate-[sf-twinkle_2s_ease-in-out_infinite] rounded-full bg-white opacity-0"
            style={{
              top: pct(s.top),
              left: pct(s.left),
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay.toFixed(5)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function StarfieldBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[14] opacity-[0.30]">
      <ScrollingStars count={75} size={2} durationSec={10} seed={1} />
      <ScrollingStars count={50} size={4} durationSec={15} seed={2} />
      <TwinkleStars count={11} size={10} seed={3} />
    </div>
  );
}
