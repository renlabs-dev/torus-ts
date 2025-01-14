// ButtonsSection.tsx
import { motion } from "framer-motion";
import { Button, Card, cn, links, ScrollArea } from "@torus-ts/ui";
import Link from "next/link";
import { useState } from "react";
import { ArrowBigDown, CircleDotDashed, Diameter } from "lucide-react";

const buttonVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: custom * 0.1 },
  }),
};

const textVariants = {
  collapsed: { opacity: 0, height: 0 },
  expanded: { opacity: 1, height: "auto" },
};

const cardVariants = {
  collapsed: { height: "auto" },
  expanded: { height: "auto" },
};

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

const CustomButton: React.FC<ButtonProps> = ({ href, children }) => (
  <Button variant="outline" size="lg" asChild className="w-28 bg-background">
    <Link href={href} target="_blank">
      {children}
    </Link>
  </Button>
);

export function ButtonsSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttonRows = [
    {
      delay: 18,
      className: "flex w-full max-w-3xl justify-around gap-[4.6em]",
      buttons: [
        {
          text: "DAO",
          href: links.governance,
        },
        { text: "Docs", href: links.docs },
        { text: "Bridge", href: links.bridge },
        {
          text: "Wallet",
          href: links.wallet,
        },
      ],
    },
    {
      delay: 20,
      className:
        "absolute mt-20 flex w-full max-w-[43rem] justify-around gap-36",
      buttons: [
        {
          text: "Blog",
          href: "https://mirror.xyz/0xF251922dcda31Bd4686485Be9A185a1B7807428E/NXi_M6QjhrEOtEkuWCbeEGR7UaYft0x2Kv5uOD4V6Bg",
        },
        { text: "Allocator", href: links.allocator },
      ],
    },
  ];

  return (
    <motion.div
      className="absolute top-44 flex w-full justify-center gap-[7em]"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* First Button */}
      <motion.div
        variants={buttonVariants}
        custom={5}
        className="absolute bottom-[4.8em] flex w-full max-w-[37rem] items-center justify-around"
      >
        <div className="full flex h-12 w-12 items-center justify-center rounded-full bg-border">
          <CircleDotDashed className="h-6 w-6" />
        </div>
        <CustomButton href="https://discord.gg/torus">Join</CustomButton>
        <div className="full flex h-12 w-12 items-center justify-center rounded-full bg-border">
          <Diameter className="h-6 w-6" />
        </div>
      </motion.div>

      {/* First Row of Buttons */}
      {buttonRows.map((row, index) => (
        <motion.div
          key={index}
          variants={buttonVariants}
          custom={row.delay}
          className={row.className}
          style={{ zIndex: isExpanded ? 1 : "auto" }}
        >
          {row.buttons.map((button, buttonIndex) => (
            <CustomButton key={buttonIndex} href={button.href}>
              {button.text}
            </CustomButton>
          ))}
        </motion.div>
      ))}

      {/* Second Row of Buttons */}
      <motion.div
        variants={buttonVariants}
        custom={10}
        className="absolute mt-40 w-full max-w-[43rem]"
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
              <motion.div layout>
                Torus is an open-ended experiment to encode biology's principles
                of autonomy, adaptive inference and self-organization into a
                stake-anchored agentic protocol, perpetually producing novelty.
              </motion.div>
              {!isExpanded && (
                <motion.div layout className="mt-2 flex justify-center">
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
                      Torus is a self-assembling & self-evolving p2p monetary
                      organism composed of an emergent multi-graph of
                      recursively delegated onchain & offchain control
                      permissions and incentives among agents, with arbitrarily
                      complex and granular emergent specialization.
                    </p>
                    <p className="mt-3">
                      The graph forms an agency-centric multi-scale competency
                      architecture with full autonomy at every level and open
                      market selection at every edge, bottom-up aligning towards
                      the stake root, able to maintain high-level coherence at
                      increasing organism complexity.
                    </p>
                    <p className="mt-3">
                      Stake is the organisms container for monetary energy,
                      transmutable towards its emergent agency. Forming a
                      circular value flow between incentives and stake in their
                      outcome.
                    </p>
                    <p className="mt-3">
                      The abstractions of control space, permissions, recursive
                      programmatic delegation and agents, expressed in an
                      emergent multi-graph, enable rich incentive programming
                      with enough self-regulation capacity to retain system
                      coherence admits adversarial presence.
                    </p>
                    <p className="mt-3">
                      Torus exhibits a continuous emergent process with
                      increasingly complex multi-scale symbiotic relationships,
                      capable of autonomous teleodynamic order and negentropic
                      adaptation.
                    </p>
                  </>
                )}
              </motion.div>
            </ScrollArea>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
