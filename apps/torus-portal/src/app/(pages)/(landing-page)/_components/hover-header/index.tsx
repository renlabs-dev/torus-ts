"use client";

import { trySync } from "@torus-network/torus-utils/try-catch";
import { Icons } from "@torus-ts/ui/components/icons";
import { cn } from "@torus-ts/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TRIGGER_ABOUT_EVENT } from "../nav-links";
import {
  DESKTOP_NAV_TREE,
  MOBILE_NAV_TREE,
  NavTree,
} from "./_components/nav-tree";

const PULSE_TRANSITION = {
  duration: 2.4,
  repeat: Infinity,
  ease: "easeInOut",
} as const;

/** Set once the visitor has opened the nav; gates the one-time attract dip. */
const NAV_DISCOVERED_STORAGE_KEY = "torus-landing-nav-discovered";

/** Idle time before the one-time attract dip nudges undiscovered visitors. */
const ATTRACT_DELAY_MS = 2000;

export function HoverHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [attract, setAttract] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openedOnceRef = useRef(false);

  const handleToggle = useCallback(() => {
    setIsOpen((open) => !open);
    if (!openedOnceRef.current) {
      openedOnceRef.current = true;
      setAttract(false);
      // Best-effort persistence; a private-mode failure just replays the hint.
      trySync(() => localStorage.setItem(NAV_DISCOVERED_STORAGE_KEY, "1"));
    }
  }, []);

  const handleAboutClick = useCallback(() => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent(TRIGGER_ABOUT_EVENT));
  }, []);

  // One-time attract hint: visitors who have never opened the nav get a
  // single emphasized chevron dip ~2s after load, then it settles back
  // into the subtle breathing bob.
  useEffect(() => {
    const [, discovered] = trySync(() =>
      localStorage.getItem(NAV_DISCOVERED_STORAGE_KEY),
    );
    if (discovered === "1") return;

    const id = setTimeout(() => {
      if (!openedOnceRef.current) setAttract(true);
    }, ATTRACT_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className="animate-fade-down pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 pt-6"
      >
        <motion.button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className={cn(
            "pointer-events-auto relative cursor-pointer rounded-2xl border p-3 transition-colors duration-300",
            isOpen
              ? "border-border bg-background"
              : "border-border/60 bg-background/40",
          )}
          animate={isOpen ? { scale: 1 } : { scale: [1, 1.03, 1] }}
          transition={isOpen ? { duration: 0.2 } : PULSE_TRANSITION}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icons.Logo className="relative z-10 h-10 w-10" />
          <motion.div
            aria-hidden="true"
            className="bg-primary/15 absolute inset-0 rounded-2xl blur-md"
            animate={
              isOpen
                ? { scale: 1.1, opacity: 1 }
                : { scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }
            }
            transition={isOpen ? { duration: 0.3 } : PULSE_TRANSITION}
          />
          {/* Disclosure hint - same idiom as the "View more" chevron below
              the hero. Fades out while the tree unfolds in its place. */}
          <motion.span
            aria-hidden="true"
            className="absolute -bottom-6 left-1/2 text-zinc-500"
            style={{ x: "-50%" }}
            animate={
              isOpen
                ? { opacity: 0, y: -4 }
                : attract
                  ? { opacity: 1, y: [0, 6, 0, 6, 0] }
                  : { opacity: 1, y: [0, 3, 0] }
            }
            transition={
              isOpen
                ? { duration: 0.15 }
                : attract
                  ? { duration: 1.3, ease: "easeInOut" }
                  : PULSE_TRANSITION
            }
            onAnimationComplete={() => {
              if (attract) setAttract(false);
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="nav-trees"
              className="pointer-events-auto w-full"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <NavTree
                spec={DESKTOP_NAV_TREE}
                onAboutClick={handleAboutClick}
                className="mx-auto hidden w-full max-w-[880px] md:block"
              />
              <NavTree
                spec={MOBILE_NAV_TREE}
                onAboutClick={handleAboutClick}
                className="mx-auto w-[min(88vw,360px)] md:hidden"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
