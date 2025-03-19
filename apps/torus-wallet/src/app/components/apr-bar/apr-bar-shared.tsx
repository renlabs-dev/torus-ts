"use client";

interface AppBarLabelProps {
  children: React.ReactNode;
}

interface AppBarValueProps {
  children: React.ReactNode;
}

interface AppBarDataGroupProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
}

export function AppBarLabel({ children }: AppBarLabelProps) {
  return <span className="text-white/60">{children}</span>;
}

export function AppBarSeparator() {
  return <span className="mx-2 text-white/30">|</span>;
}

export function AppBarArrow() {
  return <span className="mx-1 text-white/40">›</span>;
}

export function AppBarValue({ children }: AppBarValueProps) {
  return <span className="font-semibold text-white">{children}</span>;
}

export function AppBarDataGroup({ label, value, unit }: AppBarDataGroupProps) {
  return (
    <>
      <AppBarLabel>{label}</AppBarLabel>
      <AppBarArrow />
      <AppBarValue>{value}</AppBarValue>
      {unit && <span className="ml-1 text-white/50">{unit}</span>}
    </>
  );
}
