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
  isLoading?: boolean;
  fallback?: React.ReactNode;
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

export function AppBarSkeletonValue() {
  return <div className={"h-4 w-16 animate-pulse rounded bg-gray-700/30"} />;
}

export function AppBarDataGroup({
  label,
  value,
  unit,
  isLoading,
}: AppBarDataGroupProps) {
  return (
    <>
      <AppBarLabel>{label}</AppBarLabel>
      <AppBarArrow />
      {isLoading ? (
        <AppBarSkeletonValue />
      ) : (
        <>
          <AppBarValue>{value}</AppBarValue>
          {unit && <span className="ml-1 text-white/50">{unit}</span>}
        </>
      )}
    </>
  );
}
