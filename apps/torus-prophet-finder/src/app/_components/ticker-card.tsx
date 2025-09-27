import FractureArt from "~/app/_components/tickers/fracture-art";
import * as React from "react";

interface TickerCardProps {
  symbol: string; // normalized uppercase without leading $
}

export function TickerCard({ symbol }: TickerCardProps) {
  const display = `$${symbol}`;
  return (
    <div className="group relative">
      {/* aura outside the clipped card for consistency with ProfileCard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 opacity-[0.66] transition-opacity duration-300 ease-out group-focus-within:opacity-80 group-hover:opacity-80"
      >
        <div className="aura-breathe absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_40%,transparent_75%)] mix-blend-screen blur-2xl" />
        <div className="aura-breathe absolute inset-0 bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.10)_0deg_2deg,rgba(255,255,255,0)_2deg_14deg)] opacity-70 mix-blend-screen blur-[8px]" />
      </div>

      <div className="relative z-[1] block overflow-hidden rounded-none border border-white/10 bg-black shadow-[0_0_36px_rgba(255,255,255,0.075)] outline outline-1 -outline-offset-2 outline-white/10 transition-shadow transition-transform duration-300 ease-out hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_0_72px_rgba(255,255,255,0.12)] hover:outline-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30">
        {/* top hairline */}
        <div className="via-white/12 absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent to-transparent" />
        {/* square fracture canvas */}
        <div className="relative aspect-square">
          <FractureArt
            seed={symbol}
            color="#ffffff"
            strokeWidth={1.25}
            className="absolute inset-0"
          />

          {/* bottom gradient for symbol legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* overlay text */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-5">
            <div className="space-y-1">
              <p className="font-mono text-xs text-white/70 sm:text-sm">
                {display}
              </p>
              <h3 className="font-cinzel text-lg font-bold uppercase tracking-wide text-white sm:text-xl md:text-2xl">
                {symbol}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
