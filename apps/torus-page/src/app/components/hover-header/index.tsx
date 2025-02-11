// For anyone viewing this component im sorry
// this is the biggest gambiarra i wrote in my life
// the boss asked for it and i had to deliver in no time
// i hope you understand

"use client";

import { Icons, cn } from "@torus-ts/ui";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ButtonsSection } from "./_components/desktop/buttons-section";
import { LinesSVG } from "./_components/desktop/lines-svg";
import { ButtonsSectionMobile } from "./_components/mobile/buttons-section-mobile";
import { LinesSVGMobile } from "./_components/mobile/lines-svg-mobile";

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

export function HoverHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const [showStarter, setShowStarter] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

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
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    }),
  };

  const calculateGlowSize = (cursorX: number, cursorY: number): number => {
    const logoRect = contentRef.current?.getBoundingClientRect();
    if (!logoRect) return 0.8;

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

    const scale = 0.15 + (maxDistance - distance) / maxDistance;

    return scale;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
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
            setShowNetwork(false);
            setShowStarter(false);
            setIsExpanded(false);
          }}
          whileTap={{ y: 1 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="hover:background-acent/30 rounded-radius relative z-50 p-3 transition duration-300"
        >
          <Icons.Logo className="relative z-10 h-10 w-10" />
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
              <div className="hidden w-full items-center justify-center md:flex">
                <ButtonsSection
                  isExpanded={isExpanded}
                  setIsExpanded={setIsExpanded}
                  showStarter={showStarter}
                  showNetwork={showNetwork}
                  onStarterClick={() => setShowStarter(!showStarter)}
                  onNetworkClick={() => setShowNetwork(!showNetwork)}
                />
                <LinesSVG showStarter={showStarter} showNetwork={showNetwork} />
              </div>
              <div className="flex w-full items-center justify-center md:hidden">
                <ButtonsSectionMobile />
                <LinesSVGMobile />
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
