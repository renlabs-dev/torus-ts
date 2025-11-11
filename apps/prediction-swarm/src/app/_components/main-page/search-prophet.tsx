"use client";

import { useSearchStore } from "~/store/search-store";
import { SearchIcon } from "lucide-react";

export function SearchProphet() {
  const open = useSearchStore((state) => state.open);

  return (
    <div className="relative mx-auto w-full max-w-lg space-y-2 text-center">
      <div className="plus-corners">
        <button
          onClick={open}
          className="bg-background/80 hover:bg-background/90 text-muted-foreground flex h-16 w-full items-center gap-3 rounded-lg border px-5 transition-colors"
        >
          <SearchIcon className="h-5 w-5" />
          <span className="flex-1 text-left text-lg">
            Search for any x account
          </span>
          <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>
      <p className="text-sm text-white/80">
        Track prediction activity, outcomes, and performance
      </p>
    </div>
  );
}
