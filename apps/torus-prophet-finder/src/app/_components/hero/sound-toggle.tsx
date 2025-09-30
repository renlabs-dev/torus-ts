"use client";

import { Button } from "@torus-ts/ui/components/button";
import * as React from "react";

interface Props {
  className?: string;
}

export default function SoundToggle({ className }: Props) {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const onToggle = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!playing) {
      // Start playback on user gesture
      el.play()
        .then(() => setPlaying(true))
        .catch(() => undefined);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [playing]);

  return (
    <div
      className={["pointer-events-auto flex flex-col items-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <audio
        ref={audioRef}
        src="/audio/background-audio.m4a"
        loop
        preload="auto"
        playsInline
        // keep subtle by default
        onCanPlay={(e) => {
          const t = e.currentTarget;
          if (t.volume > 0.3) t.volume = 0.3;
        }}
      />
      <Button
        type="button"
        aria-label={playing ? "Mute background audio" : "Play background audio"}
        onClick={onToggle}
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:text-white"
        variant="outline"
      >
        {!playing && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300/20 group-hover:bg-sky-300/25" />
        )}
        <span className="relative z-10 leading-none">
          {playing ? <VolumeIcon size={32} /> : <MuteIcon size={32} />}
        </span>
      </Button>
    </div>
  );
}

function VolumeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.08" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MuteIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M22 9l-6 6" />
      <path d="M16 9l6 6" />
    </svg>
  );
}
