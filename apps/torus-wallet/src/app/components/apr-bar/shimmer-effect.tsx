import { motion } from "framer-motion";

export const ShimmerEffect = () => (
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
);
