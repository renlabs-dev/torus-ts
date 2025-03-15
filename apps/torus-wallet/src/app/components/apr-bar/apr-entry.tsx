import type { APRData } from "./apr-bar";
import { formatToken } from "@torus-ts/utils/subspace";

export const APREntry = ({ apr, totalStake, stakedPercentage }: APRData) => (
  <div className="flex items-center font-mono text-sm tracking-tight">
    <div className="flex items-center">
      <span className="text-white/60">APR</span>
      <span className="mx-1 text-white/40">›</span>
      <span className="font-semibold text-white">{apr?.toFixed(2)}%</span>
      <span className="mx-2 text-white/30">|</span>
      <span className="text-white/60">TOTAL STAKED</span>
      <span className="mx-1 text-white/40">›</span>
      <span className="font-semibold text-white">
        {formatToken(totalStake ?? 0n)}
      </span>
      <span className="ml-1 text-white/50">$TORUS</span>
      <span className="mx-2 text-white/30">|</span>
      <span className="text-white/60">STAKED RATIO</span>
      <span className="mx-1 text-white/40">›</span>
      <span className="font-semibold text-white">
        {stakedPercentage.toFixed(2)}%
      </span>
    </div>
  </div>
);
