"use client";

import { cn } from "@torus-ts/ui/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useLandingSidebar } from "./landing-sidebar-context";
import { TRIGGER_ABOUT_EVENT } from "./nav-links";

const CONTENT = {
  summary:
    "Torus is a scale-free, reflexive-autopoietic process for the expansion of life into cyberspace. Through local cyber-morphogenetic closure and global programmable protocol metabolism, Torus forms coherent cyber-organisms and enables them to couple, compose, and recursively unify into higher-order decentralized life.",
};

export function ViewMore() {
  const { isExpanded, setIsExpanded } = useLandingSidebar();
  const isAnimatingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsExpanded(true);

    setTimeout(() => {
      const contentTop = contentRef.current?.offsetTop ?? 0;

      window.scrollTo({
        top: contentTop,
        behavior: "smooth",
      });
    }, 0);

    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 800);
  }, [setIsExpanded]);

  const scrollToHero = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsExpanded(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 800);
  }, [setIsExpanded]);

  // Listen for external triggers (HoverHeader / sidebar About buttons).
  // Always scroll: the section may be expanded but scrolled out of view.
  useEffect(() => {
    const handleTriggerAbout = () => scrollToContent();

    window.addEventListener(TRIGGER_ABOUT_EVENT, handleTriggerAbout);
    return () =>
      window.removeEventListener(TRIGGER_ABOUT_EVENT, handleTriggerAbout);
  }, [scrollToContent]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isAnimatingRef.current) return;

      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      // Trigger expansion when scrolling down past 15% of viewport
      if (
        !isExpanded &&
        scrollingDown &&
        currentScrollY > viewportHeight * 0.15
      ) {
        scrollToContent();
      }

      // Collapse when scrolling up past the content section start
      if (isExpanded && !scrollingDown) {
        const contentTop = contentRef.current?.getBoundingClientRect().top ?? 0;
        // If content section top is pushed below 10% of viewport
        if (contentTop > viewportHeight * 0.1) {
          scrollToHero();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded, scrollToContent, scrollToHero]);

  const handleButtonClick = useCallback(() => {
    if (isExpanded) {
      scrollToHero();
    } else {
      scrollToContent();
    }
  }, [isExpanded, scrollToContent, scrollToHero]);

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
        <motion.button
          onClick={handleButtonClick}
          className={cn(
            "flex flex-col items-center gap-2",
            isExpanded ? "flex-col-reverse" : "flex-col",
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm text-zinc-400 transition-colors group-hover:text-zinc-300">
            {isExpanded ? "Back to top" : "View more"}
          </span>
          <motion.div
            animate={{ y: isExpanded ? [0, -4, 0] : [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
            )}
          </motion.div>
        </motion.button>
      </div>

      <div
        ref={contentRef}
        className={cn(
          "bg-background relative z-20 min-h-screen transition-opacity duration-500",
          isExpanded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="to-background pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent" />

        {/* px-14 keeps the text clear of the fixed 3rem sidebar rail on phones */}
        <div className="container mx-auto flex min-h-screen items-center px-14 py-24 md:px-6 md:py-32">
          <motion.article
            className="mx-auto max-w-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="prose prose-invert prose-zinc max-w-none">
              <motion.p
                className={cn(
                  "mx-auto mb-0 max-w-3xl text-center leading-relaxed text-zinc-200",
                  "text-lg md:text-2xl",
                  "font-normal",
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {CONTENT.summary}
              </motion.p>
            </div>
          </motion.article>
        </div>
      </div>
    </>
  );
}
