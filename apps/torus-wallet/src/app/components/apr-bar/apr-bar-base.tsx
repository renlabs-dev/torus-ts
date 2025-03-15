import { ShimmerEffect } from "./shimmer-effect";
import { motion } from "framer-motion";

export const APRBarBase = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-up absolute top-[3.3em] w-full">
    <div className="relative z-40 h-8 w-full overflow-hidden border-b bg-[#080808] shadow-2xl">
      <ShimmerEffect />
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
