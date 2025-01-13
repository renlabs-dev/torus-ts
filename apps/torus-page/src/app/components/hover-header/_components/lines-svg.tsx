// LinesSVG.tsx
import { motion } from "framer-motion";

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (custom: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "spring",
        duration: 1.5,
        bounce: 0,
        delay: custom * 0.5,
      },
      opacity: { duration: 0.01, delay: custom * 0.5 },
    },
  }),
};

export function LinesSVG() {
  return (
    <motion.svg
      initial="hidden"
      animate="visible"
      exit="hidden"
      key="lines"
      className="absolute top-0 -z-50"
      viewBox="0 0 320 220"
      width={240}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Left L-shaped line */}
      <motion.path
        d="M160 50 H15 Q5 50 5 60 V130"
        fill="none"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={0}
      />
      {/* Right L-shaped line */}
      <motion.path
        d="M160 50 H305 Q315 50 315 60 V130"
        fill="none"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={0}
      />
      {/* Bottom line */}
      <motion.line
        x1="160"
        y1="50"
        x2="160"
        y2="220"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={1}
      />
    </motion.svg>
  );
}
