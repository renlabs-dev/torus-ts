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

export function LinesSVG({
  showStarter,
  showNetwork,
}: {
  showStarter: boolean;
  showNetwork: boolean;
}) {
  return (
    <motion.svg
      initial="hidden"
      animate="visible"
      exit="hidden"
      key="lines"
      className="absolute top-0 -z-50"
      viewBox="0 0 1000 450"
      width={800}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Basic set of lines */}
      <motion.path
        d="M500 50 H250 Q240 50 240 60 V140"
        fill="none"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={0}
      />
      <motion.path
        d="M500 50 H750 Q760 50 760 60 V140"
        fill="none"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={0}
      />
      <motion.line
        x1="500"
        y1="50"
        x2="500"
        y2="250"
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={1}
      />
      <motion.line
        key={showStarter || showNetwork ? "extended" : "short"}
        x1="500"
        y1="50"
        x2="500"
        y2={showStarter || showNetwork ? "450" : "15"}
        stroke="#27272a"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
        custom={-1}
      />

      {/* Left group of lines */}
      {showStarter && (
        <>
          <motion.path
            d="M240 140 H115 Q105 140 105 150 V230"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0}
          />
          <motion.path
            d="M240 140 H365 Q375 140 375 150 V230"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0}
          />
          <motion.line
            x1="240"
            y1="140"
            x2="240"
            y2="340"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0}
          />
        </>
      )}

      {/* Right group of lines */}
      {showNetwork && (
        <>
          <motion.path
            d="M760 140 H635 Q625 140 625 150 V230"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0}
          />
          <motion.path
            d="M760 140 H885 Q895 140 895 150 V230"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0}
          />
          <motion.line
            x1="760"
            y1="140"
            x2="760"
            y2="340"
            stroke="#27272a"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={0.5}
          />
        </>
      )}
    </motion.svg>
  );
}
