"use client";

import { motion } from "framer-motion";

interface APRBarBaseProps {
  children: React.ReactNode;
}

export function APRBarBase({ children }: APRBarBaseProps) {
  return (
    <div className="animate-fade-up absolute top-[3.3em] w-full">
      <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
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
          {children}
        </motion.div>
      </div>
    </div>
  );
}
