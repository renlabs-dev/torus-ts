"use client";

import { Animation } from "./_components/animation";

export function AgentBanner() {
  return (
    <>
      <Animation />
      <div className="absolute right-6 top-[28em] text-xs">
        Scroll up/down ...
      </div>
    </>
  );
}
