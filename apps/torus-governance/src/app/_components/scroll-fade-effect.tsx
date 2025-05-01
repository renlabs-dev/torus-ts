"use client";

import { cn } from "@torus-ts/ui/lib/utils";

export function ScrollFadeEffect() {
  return (
    <div className={cn("pointer-events-none absolute left-0 right-0 z-10")}>
      <div className="absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
