import { APRBarBase } from "./apr-bar-base";

export const APRBarSkeleton = () => (
  <APRBarBase>
    {[0, 1].map((setIndex) => (
      <div key={setIndex} className="flex gap-32">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`${setIndex}-${index}`}
            className="flex items-center font-mono text-sm tracking-tight"
          >
            <div className="flex items-center">
              <span className="text-white/60">APR</span>
              <span className="mx-1 text-white/40">›</span>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-700/30" />
              <span className="mx-2 text-white/30">|</span>
              <span className="text-white/60">TOTAL STAKED</span>
              <span className="mx-1 text-white/40">›</span>
              <div className="h-4 w-24 animate-pulse rounded bg-gray-700/30" />
              <span className="ml-1 text-white/50">$TORUS</span>
              <span className="mx-2 text-white/30">|</span>
              <span className="text-white/60">STAKED RATIO</span>
              <span className="mx-1 text-white/40">›</span>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-700/30" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </APRBarBase>
);
