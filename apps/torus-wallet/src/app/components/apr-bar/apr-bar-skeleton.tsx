import { APRBarBase } from "./apr-bar-base";
import { AppBarDataGroup, AppBarSeparator } from "./apr-bar-shared";

function SkeletonValue({ width }: { width: string }) {
  return (
    <div className={`h-4 ${width} animate-pulse rounded bg-gray-700/30`} />
  );
}

function APREntrySkeleton() {
  return (
    <div className="flex items-center font-mono text-sm tracking-tight">
      <div className="flex items-center">
        <AppBarDataGroup label="APR" value={<SkeletonValue width="w-16" />} />
        <AppBarSeparator />
        <AppBarDataGroup
          label="TOTAL STAKED"
          value={<SkeletonValue width="w-24" />}
          unit="$TORUS"
        />
        <AppBarSeparator />
        <AppBarDataGroup
          label="STAKED RATIO"
          value={<SkeletonValue width="w-16" />}
        />
      </div>
    </div>
  );
}

export function APRBarSkeleton() {
  return (
    <APRBarBase>
      {[0, 1].map((setIndex) => (
        <div key={setIndex} className="flex gap-32">
          {Array.from({ length: 3 }).map((_, index) => (
            <APREntrySkeleton key={`${setIndex}-${index}`} />
          ))}
        </div>
      ))}
    </APRBarBase>
  );
}
