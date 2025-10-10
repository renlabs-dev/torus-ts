import Silk from "~/app/_components/silk-animation";
import { MoveDown } from "lucide-react";
import Link from "next/link";

export function FractalGrid() {
  return (
    <div className="border-border relative grid h-[60vh] w-full grid-cols-2 grid-rows-2 border-y">
      <div className="absolute inset-0 -z-10 opacity-20">
        <Silk scale={0.7} speed={4} />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-[5]" />
      <div className="border-border flex items-end justify-end border-b border-r p-8">
        <div className="max-w-sm text-right text-4xl font-extralight">
          The fractal nature of foresight
        </div>
      </div>
      <div className="border-border border-b p-8" />
      <div className="border-border border-r p-8" />
      <div className="border-border flex items-start justify-start p-8">
        <div className="flex max-w-sm flex-col gap-2">
          <p>
            From cells to societies, intelligence emerges through nested agency.
            The swarm applies this principle to predictions, mapping who to
            trust and when, turning uncertainty into clarity.
          </p>
          <Link
            target="_blank"
            href="https://docs.sension.torus.directory/"
            className="text-muted-foreground hover:text-foreground mt-2 flex items-center gap-2 transition-colors"
          >
            Read more
            <MoveDown size={16} className="rotate-[-90deg]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
