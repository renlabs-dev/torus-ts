"use client";

type EntityMode = "prophets" | "tickers";

type Props = {
  mode: EntityMode;
  onChange: (m: EntityMode) => void;
};

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
          "relative px-8 py-2.5 text-sm rounded-none transition-colors border",
          active
            ? "bg-[#090e15] text-white border-white/15 hover:border-white/25 hover:bg-[#0b111b] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),_0_0_18px_rgba(255,255,255,0.06)]"
            : "bg-transparent text-white/75 border-white/12 hover:text-white hover:bg-white/5"
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="inline-flex rounded-none overflow-hidden border border-white/10">
      {btn("prophets", "Prophets")}
      {btn("tickers", "Tickers")}
    </div>
  );
}

export type { EntityMode };
