import { ChevronsLeft, ChevronsRight } from "lucide-react";

export function CardHoverEffect() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity
        duration-300 group-hover:opacity-100"
    >
      <span
        className="bg-background flex animate-pulse items-center gap-1 rounded-full bg-opacity-75
          px-3 py-1 text-xs"
      >
        <ChevronsLeft size={16} />
        Click to expand <ChevronsRight size={16} />
      </span>
    </div>
  );
}
