"use client";

type Props = {
  onClick: () => void;
};

export default function ScrollIndicator({ onClick }: Props) {
  return (
    <div className="pb-6 flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label="Scroll to content"
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/15 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-sky-300/20 group-hover:bg-sky-300/25 animate-ping" />
        <span className="relative z-10 text-xl leading-none">⌄</span>
      </button>
    </div>
  );
}
