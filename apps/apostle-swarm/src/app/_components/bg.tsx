"use client";

interface VideoBackgroundProps {
  className?: string;
}

export default function VideoBackground({
  className = "",
}: VideoBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
