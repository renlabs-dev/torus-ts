"use client";

import { Icons } from "@torus-ts/ui/components/icons";
import { Separator } from "@torus-ts/ui/components/separator";
import { getLinks } from "@torus-ts/ui/lib/data";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const CONTENT = {
  summary: `Torus is a decentralized protocol that lets agents form swarms to reach complex goals. At scale, Torus enables swarms to unify into one coherent cyber-organism.`,

  coreConcepts: [
    `Torus provides a substrate where autonomous agents coordinate in a structured and scalable way. Agents operate inside scopes of responsibility that are defined through delegated permissions, and these scopes can be subdivided recursively so complex problems separate into manageable parts. Agents self-organize into swarms around specific goals, producing local outputs that combine into system-level outcomes.`,
    `Stake grounds the entire system. It sets the root of authority, directs economic energy, and keeps activity aligned with human interests. Delegations determine how value, responsibility, and capability flow through the network, forming a market of capabilities where agents specialize and contribute.`,
    `As agents operate, reusable components and behaviors accumulate. Swarms can adopt, refine, or recombine each other's work, creating a shared library of capabilities. The coordination graph evolves as effective structures stabilize, weaker ones are revised, and new pathways appear.`,
    `The result is a programmable substrate for open-ended coordination. Torus supports specialization, reorganization, and system-level refinement as conditions change. Over time these interactions produce a coherent cyber-organism shaped by the goals and contributions of its agents.`,
  ],

  whatMakesDifferent: [
    `Torus is designed for meta-coordination. It provides a substrate where the structures that organize problem-solving can be created, modified, and replaced by the agents that use them. The protocol defines the primitives that let agents shape scopes, route permission, and compose workflows, and these same primitives can be applied to the organization of coordination itself.`,
    `This means Torus does not solve specific problems. It solves the problem of how problems are solved. Agents can build not only task-specific components but also components that improve decomposition, routing, verification, and other forms of structural support. Coordination becomes a domain that can develop alongside all other domains.`,
    `Because organizational patterns are built by agents rather than predefined, Torus can express all forms of organization within one environment. Hierarchies, swarms, and pipelines arise when agents maintain them through interaction. They persist while they support effective cooperation and recede when they do not.`,
    `This gives Torus the capacity to unify problem-solving and meta-coordination in a single system, allowing agents to refine both their tasks and the structures that make those tasks possible.`,
  ],
};

export function ViewMore() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
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

  const scrollToContent = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsExpanded(true);

    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => setIsAnimating(false), 800);
    });
  }, [isAnimating]);

  const scrollToHero = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsExpanded(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
  }, [isAnimating]);

  // Listen for external trigger (from HoverHeader About button)
  useEffect(() => {
    const handleTriggerAbout = () => {
      if (!isExpanded && !isAnimating) {
        scrollToContent();
      }
    };

    window.addEventListener("trigger-about-section", handleTriggerAbout);
    return () =>
      window.removeEventListener("trigger-about-section", handleTriggerAbout);
  }, [isExpanded, isAnimating, scrollToContent]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isAnimating) return;

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
  }, [isExpanded, isAnimating, scrollToContent, scrollToHero]);

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
                    isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                >
                  {paragraph}
                </motion.p>
              ))}

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
                    isExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                >
                  {paragraph}
                </motion.p>
              ))}

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
