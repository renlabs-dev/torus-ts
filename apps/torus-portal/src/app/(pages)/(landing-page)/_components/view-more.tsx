"use client";

import { Icons } from "@torus-ts/ui/components/icons";
import { Separator } from "@torus-ts/ui/components/separator";
import { getLinks } from "@torus-ts/ui/lib/data";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useLandingSidebar } from "./landing-sidebar-context";

const CONTENT = {
  summary: `Torus is a scale-free, reflexive-autopoietic process for the expansion of life into cyberspace.

Through local cyber-morphogenetic closure and global programmable protocol metabolism, Torus forms coherent cyber-organisms and enables them to couple, compose, and recursively unify into higher-order decentralized life.

In R&D.`,
  coreConcepts: [] as string[],
  whatMakesDifferent: [] as string[],
};

export function ViewMore() {
  const { isExpanded, setIsExpanded } = useLandingSidebar();
  const isAnimatingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

  const socialList = [
    {
      name: "Discord",
      href: links.discord,
      icon: <Icons.Discord className="h-5 w-5" />,
    },
    {
      name: "X",
      href: links.x,
      icon: <Icons.X className="h-5 w-5" />,
    },
    {
      name: "GitHub",
      href: links.github,
      icon: <Icons.Github className="h-5 w-5" />,
    },
    {
      name: "Telegram",
      href: links.telegram,
      icon: <Icons.Telegram className="h-5 w-5" />,
    },
  ];
  const hasCoreConcepts = CONTENT.coreConcepts.length > 0;
  const hasWhatMakesDifferent = CONTENT.whatMakesDifferent.length > 0;
  const hasDetailedSections = hasCoreConcepts || hasWhatMakesDifferent;

  const scrollToContent = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsExpanded(true);

    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 800);
    });
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

  // Listen for external trigger (from HoverHeader About button)
  useEffect(() => {
    const handleTriggerAbout = () => {
      if (!isExpanded && !isAnimatingRef.current) {
        scrollToContent();
      }
    };

    window.addEventListener("trigger-about-section", handleTriggerAbout);
    return () =>
      window.removeEventListener("trigger-about-section", handleTriggerAbout);
  }, [isExpanded, scrollToContent]);

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

        <div className="container mx-auto px-6 py-24 md:py-32">
          <motion.article
            className="mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="prose prose-invert prose-zinc max-w-none">
              <motion.p
                className={cn(
                  "mb-6 leading-relaxed text-zinc-300",
                  "text-base md:text-lg",
                  "font-normal tracking-wide",
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {CONTENT.summary}
              </motion.p>

              {hasCoreConcepts && (
                <>
                  <motion.div
                    className="my-12"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={
                      isExpanded
                        ? { opacity: 1, scaleX: 1 }
                        : { opacity: 0, scaleX: 0 }
                    }
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Separator />
                  </motion.div>

                  {CONTENT.coreConcepts.map((paragraph, index) => (
                    <motion.p
                      key={`core-${index}`}
                      className={cn(
                        "mb-6 leading-relaxed text-zinc-300",
                        "text-base md:text-lg",
                        "font-normal tracking-wide",
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isExpanded
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 20 }
                      }
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </>
              )}

              {hasWhatMakesDifferent && (
                <>
                  <motion.h2
                    className="mb-6 mt-12 text-start text-base font-medium uppercase tracking-widest text-zinc-400 md:text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                      isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                    }
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    What Makes Torus Different
                  </motion.h2>

                  {CONTENT.whatMakesDifferent.map((paragraph, index) => (
                    <motion.p
                      key={`diff-${index}`}
                      className={cn(
                        "mb-6 leading-relaxed text-zinc-300",
                        "text-base md:text-lg",
                        "font-normal tracking-wide",
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isExpanded
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 20 }
                      }
                      transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </>
              )}

              {hasDetailedSections && (
                <motion.div
                  className="my-12"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={
                    isExpanded
                      ? { opacity: 1, scaleX: 1 }
                      : { opacity: 0, scaleX: 0 }
                  }
                  transition={{ delay: 1.5, duration: 0.5 }}
                >
                  <Separator />
                </motion.div>
              )}

              <motion.div
                className="flex justify-center gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                {socialList.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </motion.div>
            </div>
          </motion.article>
        </div>
      </div>
    </>
  );
}
