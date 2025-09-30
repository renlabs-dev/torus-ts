"use client";

import { ArrowDown } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ScrollIndicator({ onClick }: Props) {
  return (
    <div className="flex items-center justify-center pb-6">
      <button
        type="button"
        onClick={onClick}
        aria-label="Scroll to content"
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:text-white"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300/20 group-hover:bg-sky-300/25" />
        <span className="relative z-10 text-xl leading-none">
          <ArrowDown className="text-muted-foreground" />
        </span>
      </button>
    </div>
  );
}
