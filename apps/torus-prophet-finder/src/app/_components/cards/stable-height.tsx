"use client";

import * as React from "react";

interface Props {
  locked: boolean; // when true, keep previous height to avoid scroll jumps
  minEmptyPx?: number; // fallback min height when nothing measured yet
  className?: string;
  children: React.ReactNode;
}

export default function StableHeight({
  locked,
  minEmptyPx = 640,
  className,
  children,
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [lastHeight, setLastHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setLastHeight(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minHeight = locked ? Math.max(lastHeight, minEmptyPx) : undefined;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={minHeight ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
