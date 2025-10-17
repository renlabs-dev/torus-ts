export function ProfileCardSkeleton() {
  return (
    <div className="group relative">
      {/* heavenly aura (subtle glow + rays) placed outside the clipped card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 opacity-[0.66]"
      >
        {/* soft halo */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_40%,transparent_75%)] mix-blend-screen blur-[48px]" />
      </div>

      <div className="relative z-[1] overflow-hidden rounded-none border border-white/10 shadow-[0_0_36px_rgba(255,255,255,0.075)] outline outline-1 -outline-offset-2 outline-white/10">
        {/* top hairline */}
        <div className="via-white/12 absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent to-transparent" />

        {/* album cover skeleton */}
        <div className="relative aspect-square animate-pulse bg-zinc-900">
          {/* base dimming */}
          <div className="absolute inset-0 z-10 bg-black/45" />

          {/* shimmer effect */}
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          {/* fine film grain */}
          <div className="grain-overlay pointer-events-none absolute inset-0" />
          {/* subtle paper tint */}
          <div className="paper-tint-overlay pointer-events-none absolute inset-0" />

          {/* mythic cyber overlay: scanlines + triangulated grid (monochrome) */}
          <div className="scanlines-overlay-cyber pointer-events-none absolute inset-0" />
          <div className="tri-grid-overlay-cyber pointer-events-none absolute inset-0" />

          {/* bottom gradient for legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />

          {/* top-left progress label skeleton */}
          <div className="absolute left-0 top-0 z-30 p-3">
            <div className="h-5 w-32 animate-pulse rounded-sm bg-white/10" />
          </div>

          {/* overlay text skeletons */}
          <div className="absolute inset-x-0 bottom-0 z-30 p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                {/* handle skeleton */}
                <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                {/* name skeleton */}
                <div className="h-7 w-40 animate-pulse rounded bg-white/20" />
                {/* stats skeleton */}
                <div className="flex items-center gap-3">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                  <span className="text-white/40">•</span>
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
