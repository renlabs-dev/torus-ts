"use client";

import { motion } from "framer-motion";
import { formatToken } from "@torus-ts/utils/subspace";

interface RunningAPRBarProps {
  apr: number;
  totalStaked: bigint;
  totalSupply: bigint;
}

export function RunningAPRBar({
  apr,
  totalStaked,
  totalSupply,
}: RunningAPRBarProps) {
  const aprEntries = Array.from({ length: 5 }, () => ({
    value: apr,
  }));

  const stakedPercentage =
    Number(totalStaked * 100000n) / Number(totalSupply) / 1000;

  return (
    <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
      {/* Subtle motion indicators */}
      <div className="absolute inset-0 flex justify-center">
        <motion.div
          className="h-full w-[200px] rotate-45 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent"
          initial={{ x: -500 }}
          animate={{ x: 500 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        className="absolute flex h-full w-full items-center gap-32 whitespace-nowrap"
        initial={{ x: "0%" }}
        animate={{ x: "-50%" }}
        transition={{
          duration: 80,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex gap-32">
            {aprEntries.map((_, index) => (
              <div
                key={`${setIndex}-${index}`}
                className="flex items-center font-mono text-sm tracking-tight"
              >
                <div className="flex items-center">
                  <span className="text-white/60">APR</span>
                  <span className="mx-1 text-white/40">›</span>
                  <span className="font-semibold text-white">
                    {apr.toFixed(2)}%
                  </span>
                  <span className="mx-2 text-white/30">|</span>
                  <span className="text-white/60">TOTAL STAKED</span>
                  <span className="mx-1 text-white/40">›</span>
                  <span className="font-semibold text-white">
                    {formatToken(totalStaked)}
                  </span>
                  <span className="ml-1 text-white/50">$TORUS</span>
                  <span className="mx-2 text-white/30">|</span>
                  <span className="text-white/60">NETWORK RATIO</span>
                  <span className="mx-1 text-white/40">›</span>
                  <span className="font-semibold text-white">
                    {stakedPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
