import { ANIMATIONS } from "../data";
import { motion } from "framer-motion";

export function LinesSVGMobile() {
  return (
    <motion.svg
      initial="hidden"
      animate="visible"
      exit="hidden"
      key="lines"
      className="absolute top-2 -z-50"
      viewBox="0 0 1000 750"
      width={600}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Original set of lines */}
      <motion.path
        d="M500 50 H250 Q240 50 240 60 V140"
        fill="none"
        stroke="#27272a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={ANIMATIONS.DRAW}
        custom={0}
      />
      <motion.path
        d="M500 50 H750 Q760 50 760 60 V140"
        fill="none"
        stroke="#27272a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={ANIMATIONS.DRAW}
        custom={0}
      />
      <motion.line
        x1="500"
        y1="50"
        x2="500"
        y2="700"
        stroke="#27272a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={ANIMATIONS.DRAW}
        custom={1}
      />
      {/* Left group of lines */}
      <motion.path
        d="M240 140 H355 Q365 140 365 150 V500"
        fill="none"
        stroke="#27272a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={ANIMATIONS.DRAW}
        custom={1.2}
      />
      {/* Right group of lines */}
      <motion.path
        d="M760 140 H645 Q635 140 635 150 V500"
        fill="none"
        stroke="#27272a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={ANIMATIONS.DRAW}
        custom={1.2}
      />
    </motion.svg>
  );
}
