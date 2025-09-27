import Image from "next/image";
import Link from "next/link";
import * as React from "react";

interface ProfileCardProps {
  name: string; // display name
  handle: string; // e.g., @0xmaki
  twitterUrl: string;
  imageSrc: string;
  followers: number;
  tweetsCurrent: number;
  tweetsTotal: number;
  collectionProgress: number; // 0-100
}

const numberFormatter = new Intl.NumberFormat("en-US");
const fmt = (n: number) => numberFormatter.format(n);

export function ProfileCard({
  name,
  handle,
  twitterUrl,
  imageSrc,
  followers,
  tweetsCurrent,
  tweetsTotal,
  collectionProgress,
}: ProfileCardProps) {
  const clampedProgress = Math.max(
    0,
    Math.min(100, Math.round(collectionProgress)),
  );
  const shadedWidthPercent = 100 - clampedProgress; // inverse shading: more scraped => less shadow
  const feather = Math.min(
    14,
    Math.max(6, Math.round(shadedWidthPercent * 0.25)),
  ); // smoothing width in %
  const hardStop = Math.max(0, shadedWidthPercent - feather);
  return (
    <div className="group relative">
      {/* heavenly aura (subtle glow + rays) placed outside the clipped card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 z-0 opacity-[0.66] transition-opacity duration-300 ease-out group-focus-within:opacity-80 group-hover:opacity-80"
      >
        {/* soft halo (breathing) */}
        <div className="aura-breathe absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_40%,transparent_75%)] mix-blend-screen blur-2xl" />
        {/* gentle rays (breathing in sync) */}
        <div className="aura-breathe absolute inset-0 bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.10)_0deg_2deg,rgba(255,255,255,0)_2deg_14deg)] opacity-70 mix-blend-screen blur-[8px]" />
      </div>

      <Link
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} (${handle}) on X/Twitter`}
        className="relative z-[1] block overflow-hidden rounded-none border border-white/10 shadow-[0_0_36px_rgba(255,255,255,0.075)] outline outline-1 -outline-offset-2 outline-white/10 transition-shadow transition-transform duration-300 ease-out hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_0_72px_rgba(255,255,255,0.12)] hover:outline-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30"
      >
        {/* top hairline */}
        <div className="via-white/12 absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent to-transparent" />

        {/* album cover image */}
        <div className="relative aspect-square bg-black">
          <Image
            src={imageSrc}
            alt={`${name} cover`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="vintage-photo object-cover transition-all duration-300"
            priority={false}
          />

          {/* base dimming to avoid overly bright cards (always present) */}
          <div className="absolute inset-0 z-10 bg-black/45" />

          {/* inverse progress shadow: natural left-to-right falloff (feathered) */}
          <div
            className="absolute inset-0 z-20"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) ${hardStop}%, rgba(0,0,0,0.0) ${shadedWidthPercent}%, rgba(0,0,0,0.0) 100%)`,
            }}
          />

          {/* soft-light pass to deepen midtones further */}
          <div className="pointer-events-none absolute inset-0 bg-black/35 mix-blend-soft-light" />

          {/* vignette with deeper edges to emphasize shadows */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_50%,transparent_42%,rgba(0,0,0,0.52)_68%,rgba(0,0,0,0.88)_100%)]" />

          {/* fine film grain */}
          <div className="grain-overlay pointer-events-none absolute inset-0" />
          {/* subtle paper tint */}
          <div className="paper-tint-overlay pointer-events-none absolute inset-0" />
          {/* hairline scratches */}
          <div className="scratches-overlay pointer-events-none absolute inset-0" />

          {/* subtle specular highlight on hover to make card stand out */}
          <div
            className="pointer-events-none absolute inset-0 z-20 opacity-0 mix-blend-screen transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={{
              backgroundImage:
                "radial-gradient(80% 50% at 85% 20%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.0) 65%)",
            }}
          />

          {/* bottom gradient for legibility (slightly taller/stronger) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />

          {/* top-left small progress label */}
          <div className="absolute left-0 top-0 z-30 p-3">
            <span className="rounded-sm bg-black/40 px-2 py-1 font-mono text-[10px] text-white/80 sm:text-xs">
              Collection Progress {clampedProgress}%
            </span>
          </div>

          {/* overlay text */}
          <div className="absolute inset-x-0 bottom-0 z-30 p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-xs text-white/70 sm:text-sm">
                  {handle}
                </p>
                <h3 className="font-cinzel text-lg font-bold uppercase tracking-wide text-white/95 sm:text-xl md:text-2xl">
                  {name}
                </h3>
                <div className="flex items-center gap-3 font-mono text-[11px] text-white/70 sm:text-xs">
                  <span>{fmt(followers)} followers</span>
                  <span className="text-white/40">•</span>
                  <span>
                    {fmt(tweetsCurrent)}/{fmt(tweetsTotal)} tweets
                  </span>
                </div>
              </div>
              <span className="translate-x-0 text-xl leading-none text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white">
                ↗
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
