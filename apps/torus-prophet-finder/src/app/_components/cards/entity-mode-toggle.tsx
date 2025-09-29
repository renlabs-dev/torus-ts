"use client";

type EntityMode = "prophets" | "tickers";

interface Props {
  mode: EntityMode;
  onChange: (m: EntityMode) => void;
}

export default function EntityModeToggle({ mode, onChange }: Props) {
  const btn = (value: EntityMode, label: string) => {
    const active = mode === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => onChange(value)}
        className={[
          "relative rounded-none border px-8 py-2.5 text-sm transition-colors",
          active
            ? "border-white/15 bg-[#090e15] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),_0_0_18px_rgba(255,255,255,0.06)] hover:border-white/25 hover:bg-[#0b111b]"
            : "border-white/12 bg-[#090e15] text-white/80 hover:border-white/20 hover:bg-[#0b111b] hover:text-white",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="inline-flex overflow-hidden rounded-none border border-white/10">
      {btn("prophets", "Prophets")}
      {btn("tickers", "Tickers")}
    </div>
  );
}

export type { EntityMode };
