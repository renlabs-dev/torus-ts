"use client";

import { Button, Card, cn, Icons, ScrollArea } from "@torus-ts/ui";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigDown } from "lucide-react";
import Link from "next/link";

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

const cardVariants = {
  collapsed: { height: "auto" },
  expanded: { height: "auto" },
};

const textVariants = {
  collapsed: { opacity: 0, height: 0 },
  expanded: { opacity: 1, height: "auto" },
};

const buttonVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: custom * 0.1 },
  }),
};

export function HoverHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const calculateDistance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const glowVariants = {
    pulse: (scale: number) => ({
      scale: [scale, scale * 1.2, scale],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  };

  const calculateGlowSize = (cursorX: number, cursorY: number): number => {
    const logoRect = contentRef.current?.getBoundingClientRect();
    if (!logoRect) return 0.8; // Changed from 1 to 0.8

    const logoCenterX = logoRect.left + logoRect.width / 2;
    const logoCenterY = logoRect.top + logoRect.height / 2;

    const distance = calculateDistance(
      cursorX,
      cursorY,
      logoCenterX,
      logoCenterY,
    );
    const maxDistance = Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2),
    );

    // Inverse the scale so it's larger when closer
    const scale = 0.15 + (maxDistance - distance) / maxDistance; // Changed from 0.2 to 0.15

    return scale;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={() => setIsVisible(false)}
          />
        )}
      </AnimatePresence>
      <div
        ref={contentRef}
        className={cn(
          "fixed left-0 right-0 top-0 z-50 mt-4 flex w-full animate-fade-down flex-col items-center pb-6 pt-2 md:justify-center",
        )}
      >
        <motion.button
          onClick={() => {
            setIsVisible(!isVisible);
            setIsHovered(true);
          }}
          whileTap={{ y: 1 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="hover:background-acent/30 relative z-50 rounded-md p-3 transition duration-300"
        >
          <Icons.logo className="relative z-10 h-10 w-10" />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/15 blur-md"
            animate="pulse"
            variants={glowVariants}
            custom={calculateGlowSize(cursorPosition.x, cursorPosition.y) / 1.2}
          />
        </motion.button>

        <AnimatePresence>
          {(isHovered || isVisible) && (
            <motion.svg
              initial="hidden"
              animate="visible"
              exit="hidden"
              key="rect"
              className="absolute top-0 mt-1"
              width="72"
              height="72"
              viewBox="0 0 72 72"
            >
              <motion.rect
                width="69"
                height="69"
                x="1"
                y="1"
                rx="10"
                fill="#09090B"
                stroke="#27272a"
                strokeWidth="2"
                variants={draw}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isVisible && (
            <>
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
              {/* Buttons */}
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
                          isExpanded
                            ? "h-[calc(65vh)] md:h-[calc(50vh)]"
                            : "h-fit",
                          "pr-2",
                        )}
                      >
                        <motion.div layout>
                          Torus is an open-ended experiment to encode biology's
                          principles of autonomy, adaptive inference and
                          self-organization into a stake-anchored agentic
                          protocol, perpetually producing novelty.
                        </motion.div>
                        {!isExpanded && (
                          <motion.div
                            layout
                            className="mt-2 flex justify-center"
                          >
                            <ArrowBigDown className="h-6 w-6 animate-pulse text-zinc-500" />
                          </motion.div>
                        )}
                        <motion.div
                          variants={textVariants}
                          initial="collapsed"
                          animate={isExpanded ? "expanded" : "collapsed"}
                          transition={{ duration: 0.5 }}
                        >
                          {isExpanded && (
                            <>
                              <p className="mt-3">
                                Torus is a self-assembling & self-evolving p2p
                                monetary organism composed of an emergent
                                multi-graph of recursively delegated onchain &
                                offchain control permissions and incentives
                                among agents, with arbitrarily complex and
                                granular emergent specialization.
                              </p>
                              <p className="mt-3">
                                The graph forms an agency-centric multi-scale
                                competency architecture with full autonomy at
                                every level and open market selection at every
                                edge, bottom-up aligning towards the stake root,
                                able to maintain high-level coherence at
                                increasing organism complexity.
                              </p>
                              <p className="mt-3">
                                Stake is the organisms container for monetary
                                energy, transmutable towards its emergent
                                agency. Forming a circular value flow between
                                incentives and stake in their outcome.
                              </p>
                              <p className="mt-3">
                                The abstractions of control space, permissions,
                                recursive programmatic delegation and agents,
                                expressed in an emergent multi-graph, enable
                                rich incentive programming with enough
                                self-regulation capacity to retain system
                                coherence admits adversarial presence.
                              </p>
                              <p className="mt-3">
                                Torus exhibits a continuous emergent process
                                with increasingly complex multi-scale symbiotic
                                relationships, capable of autonomous
                                teleodynamic order and negentropic adaptation.
                              </p>
                            </>
                          )}
                        </motion.div>
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
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
