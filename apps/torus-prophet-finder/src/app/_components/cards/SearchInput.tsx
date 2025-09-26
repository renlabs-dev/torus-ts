"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
};

export default function SearchInput({ value, onChange, placeholder, label, id }: Props) {
  const inputId = id ?? "prophet-search";
  return (
    <div className="min-w-[220px] flex-1">
      <label htmlFor={inputId} className="sr-only">
        {label ?? "Search prophets by name"}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search prophets by name…"}
        className="w-full rounded-none bg-[#090e15] border border-white/15 px-4 py-2.5 text-sm text-white placeholder-white/50 outline-none focus:border-white/35 focus:ring-0 shadow-[0_0_24px_rgba(255,255,255,0.04)]"
      />
    </div>
  );
}
