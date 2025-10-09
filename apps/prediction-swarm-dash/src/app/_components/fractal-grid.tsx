import { MoveDown } from "lucide-react";
import Link from "next/link";
import Silk from "@/components/silk-animation";

export function FractalGrid() {
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-[60vh] relative border-y border-border">
      <div className="absolute inset-0 -z-10 opacity-20">
        <Silk scale={0.7} speed={4} />
      </div>
      <div className="absolute inset-0 -z-[5] pointer-events-none" />
      <div className="border-r border-b border-border p-8 flex items-end justify-end">
        <div className="text-4xl font-extralight w-xs text-right">
          The fractal nature of foresight
        </div>
      </div>
      <div className="border-b border-border p-8" />
      <div className="border-r border-border p-8" />
      <div className="border-border p-8 flex items-start justify-start">
        <div className="flex flex-col gap-2 w-sm">
          <p>
            From cells to societies, intelligence emerges through nested agency.
            The swarm applies this principle to predictions, mapping who to
            trust and when, turning uncertainty into clarity.
          </p>
          <Link
            target="_blank"
            href="https://docs.sension.torus.directory/"
            className="text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors mt-2"
          >
            Read more
            <MoveDown size={16} className="rotate-[-90deg]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
