// ButtonsSection.tsx
import { motion } from "framer-motion";
import { Button, Card, cn, ScrollArea } from "@torus-ts/ui";
import Link from "next/link";

import { useState } from "react";

const buttonVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: custom * 0.1 },
  }),
};

const cardVariants = {
  collapsed: { height: "auto" },
  expanded: { height: "auto" },
};

export function ButtonsSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="absolute top-20 flex w-full justify-center gap-[8.3em]"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div variants={buttonVariants} custom={5}>
        <Button variant="outline" size="lg" asChild>
          <Link href="https://discord.gg/torus" target="_blank">
            Join
          </Link>
        </Button>
      </motion.div>
      <motion.div
        variants={buttonVariants}
        custom={8}
        className="absolute mt-14 w-full max-w-[43rem]"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
      >
        <motion.div
          layout
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          variants={cardVariants}
          transition={{ duration: 0.5 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Card className="mx-5 cursor-pointer overflow-hidden pb-4 pl-6 pr-4 pt-6 md:mx-0">
            <ScrollArea
              className={cn(
                isExpanded ? "h-[calc(65vh)] md:h-[calc(50vh)]" : "h-fit",
                "pr-2",
              )}
            >
              {/* Card content */}
              {/* ... (Same as in the original component) */}
            </ScrollArea>
          </Card>
        </motion.div>
      </motion.div>
      <motion.div variants={buttonVariants} custom={5}>
        <Button variant="outline" size="lg" asChild>
          <Link
            href="https://mirror.xyz/0xF251922dcda31Bd4686485Be9A185a1B7807428E/NXi_M6QjhrEOtEkuWCbeEGR7UaYft0x2Kv5uOD4V6Bg"
            target="_blank"
          >
            Blog
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
