import * as React from "react";
import FractureArt from "~/app/_components/tickers/FractureArt";

type TickerCardProps = {
  symbol: string; // normalized uppercase without leading $
};

export function TickerCard({ symbol }: TickerCardProps) {
  const display = `$${symbol}`;
  return (
    <div className="group relative">
      {/* aura outside the clipped card for consistency with ProfileCard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 opacity-[0.66] group-hover:opacity-80 group-focus-within:opacity-80 transition-opacity duration-300 ease-out"
      >
        <div className="absolute inset-0 blur-2xl mix-blend-screen bg-[radial-gradient(60%_55%_at_50%_45%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_40%,transparent_75%)] aura-breathe" />
        <div className="absolute inset-0 blur-[8px] opacity-70 mix-blend-screen bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.10)_0deg_2deg,rgba(255,255,255,0)_2deg_14deg)] aura-breathe" />
      </div>

      <div className="relative block rounded-none border border-white/10 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30 transition-transform duration-300 ease-out hover:scale-[1.01] hover:border-white/20 z-[1] shadow-[0_0_36px_rgba(255,255,255,0.075)] hover:shadow-[0_0_72px_rgba(255,255,255,0.12)] transition-shadow outline outline-1 -outline-offset-2 outline-white/10 hover:outline-white/20 bg-black">
        {/* top hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent z-20" />
        {/* square fracture canvas */}
        <div className="relative aspect-square">
          <FractureArt seed={symbol} color="#ffffff" strokeWidth={1.25} className="absolute inset-0" />

          {/* bottom gradient for symbol legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* overlay text */}
          <div className="absolute inset-x-0 bottom-0 p-5 z-10">
            <div className="space-y-1">
              <p className="font-mono text-white/70 text-xs sm:text-sm">{display}</p>
              <h3 className="font-cinzel font-bold text-white text-lg sm:text-xl md:text-2xl tracking-wide uppercase">
                {symbol}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
