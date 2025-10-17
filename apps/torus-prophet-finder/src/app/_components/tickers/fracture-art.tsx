"use client";

import * as React from "react";

interface Pt {
  x: number;
  y: number;
}

interface FractureArtProps {
  seed: string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

type Rng = () => number;

function hashStringToInt(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function vecSub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

function vecLen(v: Pt): number {
  return Math.hypot(v.x, v.y);
}

function splitAt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function longestEdge(a: Pt, b: Pt, c: Pt): { A: Pt; B: Pt; C: Pt } {
  const ab = vecLen(vecSub(a, b));
  const bc = vecLen(vecSub(b, c));
  const ca = vecLen(vecSub(c, a));
  if (ab >= bc && ab >= ca) return { A: a, B: b, C: c };
  if (bc >= ab && bc >= ca) return { A: b, B: c, C: a };
  return { A: c, B: a, C: b };
}

function genBaseTriangle(w: number, h: number): [Pt, Pt, Pt] {
  // Large triangle that covers the rectangle area
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.max(w, h) * 1.25; // oversize so cracks span fully
  const a: Pt = { x: cx, y: cy - r };
  const b: Pt = { x: cx - r * 0.866, y: cy + r * 0.5 };
  const c: Pt = { x: cx + r * 0.866, y: cy + r * 0.5 };
  return [a, b, c];
}

function fractureLines(
  w: number,
  h: number,
  rng: Rng,
  maxDepth: number,
): [Pt, Pt][] {
  const segments: [Pt, Pt][] = [];
  const stack: { a: Pt; b: Pt; c: Pt; depth: number }[] = [];
  const [a0, b0, c0] = genBaseTriangle(w, h);
  stack.push({ a: a0, b: b0, c: c0, depth: 0 });

  const lerpMin = 0.35;
  const lerpMax = 0.65;

  while (stack.length > 0) {
    const popped = stack.pop();
    if (!popped) break;
    const { a, b, c, depth } = popped;
    if (depth >= maxDepth) continue;

    const { A, B, C } = longestEdge(a, b, c);
    const t = lerp(lerpMin, lerpMax, rng());
    const p = splitAt(A, B, t);

    // Draw fracture line from apex C to split point p
    segments.push([C, p]);

    // Slightly vary depth growth to create uneven density
    const extra = rng() < 0.6 ? 1 : 0;
    const nextDepth = depth + 1 + extra;
    if (nextDepth <= maxDepth) {
      stack.push({ a: C, b: B, c: p, depth: nextDepth });
      stack.push({ a: C, b: p, c: A, depth: nextDepth });
    }
    if (segments.length > 2000) break; // safety cap
  }

  return segments;
}

export function FractureArt({
  seed,
  color = "#ffffff",
  strokeWidth = 1.25,
  className,
}: FractureArtProps) {
  const viewW = 1000;
  const viewH = 1000; // square; scales to card via preserveAspectRatio="none"

  const [segments, setSegments] = React.useState<[Pt, Pt][]>([]);
  React.useEffect(() => {
    const rng = mulberry32(hashStringToInt(`fracture:${seed}`));
    const depth = 9 + Math.floor(rng() * 3); // 9–11
    setSegments(fractureLines(viewW, viewH, rng, depth));
  }, [seed, viewW, viewH]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${viewW} ${viewH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x={0} y={0} width={viewW} height={viewH} fill="black" />
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
        {segments.map(([p1, p2], i) => (
          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />
        ))}
      </g>
    </svg>
  );
}

export default FractureArt;
