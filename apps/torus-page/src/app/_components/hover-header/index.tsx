"use client";

import { Icons } from "@torus-ts/ui/components/icons";
import { cn } from "@torus-ts/ui/lib/utils";
import type { Variants } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ANIMATIONS } from "./_components/data";
import { ButtonsSection } from "./_components/desktop/buttons-section";
import { LinesSVG } from "./_components/desktop/lines-svg";
import { ButtonsSectionMobile } from "./_components/mobile/buttons-section-mobile";
import { LinesSVGMobile } from "./_components/mobile/lines-svg-mobile";

export function HoverHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [glowSize, setGlowSize] = useState(0.8);

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
      // Calculate glow size here where ref access is safe
      const logoRect = contentRef.current?.getBoundingClientRect();
      if (!logoRect) {
        setGlowSize(0.8);
        return;
      }

      const logoCenterX = logoRect.left + logoRect.width / 2;
      const logoCenterY = logoRect.top + logoRect.height / 2;

      const distance = calculateDistance(
        event.clientX,
        event.clientY,
        logoCenterX,
        logoCenterY,
      );
      const maxDistance = Math.sqrt(
        Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2),
      );

      const scale = 0.15 + (maxDistance - distance) / maxDistance;
      setGlowSize(scale / 1.2);
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
          `animate-fade-down fixed left-0 right-0 top-0 z-50 mt-4 flex w-full flex-col items-center pb-6 pt-2 md:justify-center`,
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
            className="bg-primary/15 absolute inset-0 rounded-2xl blur-md"
            animate="pulse"
            variants={glowVariants as Variants}
            custom={glowSize}
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
                variants={ANIMATIONS.DRAW as Variants}
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
