"use client";

import { motion } from "framer-motion";

interface RunningAPRBarProps {
  apr: number;
}

export function RunningAPRBar({ apr }: RunningAPRBarProps) {
  const aprEntries = Array.from({ length: 5 }, () => ({
    value: apr,
  }));

  return (
    <div className="relative h-8 w-full overflow-hidden bg-gray-800/95 shadow-sm">
      {/* Subtle motion indicators */}
      <div className="absolute inset-0 flex justify-center">
        <motion.div
          className="h-full w-[200px] rotate-45 bg-gradient-to-r from-transparent via-gray-500/10 to-transparent"
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
        className="absolute flex h-full w-full items-center gap-48 whitespace-nowrap"
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
          <div key={setIndex} className="flex gap-48">
            {aprEntries.map((_, index) => (
              <div
                key={`${setIndex}-${index}`}
                className="flex items-center gap-2 text-sm tracking-wide text-white/90"
              >
                <span className="font-medium">APR</span>
                <span className="text-white/50">~</span>
                <span className="font-semibold">{apr.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
