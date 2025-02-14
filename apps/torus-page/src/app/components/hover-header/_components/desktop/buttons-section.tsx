import { Button, Card, cn, links, ScrollArea } from "@torus-ts/ui";
import { motion } from "framer-motion";
import { ArrowBigDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  isHidden?: boolean;
}

function CustomButton({ href, children, isHidden }: Readonly<ButtonProps>) {
  if (isHidden) {
    return (
      <Button className="invisible w-28" size="lg">
        gambiarra
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="lg"
      asChild
      className={`w-28 animate-fade-down bg-background animate-delay-300`}
    >
      <Link href={href} target="_blank">
        {children}
      </Link>
    </Button>
  );
}

interface ButtonsSectionProps {
  showStarter: boolean;
  showNetwork: boolean;
  onStarterClick: () => void;
  onNetworkClick: () => void;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ButtonsSection({
  showStarter,
  showNetwork,
  onStarterClick,
  onNetworkClick,
  isExpanded,
  setIsExpanded,
}: Readonly<ButtonsSectionProps>) {
  const [cardPosition, setCardPosition] = useState(40);

  useEffect(() => {
    if (showStarter || showNetwork) {
      setCardPosition(150);
    } else {
      setCardPosition(20);
    }
  }, [showStarter, showNetwork]);

  return (
    <motion.div
      className="absolute top-44 flex w-full justify-center gap-[7em]"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* First Button Row */}
      <motion.div
        variants={buttonVariants}
        custom={5}
        className="absolute bottom-[5.2em] flex w-full max-w-[38.5rem] items-center justify-around"
      >
        <Button
          className="rounded-full bg-accent hover:bg-background disabled:opacity-100"
          onClick={onStarterClick}
          variant="outline"
        >
          Starter
        </Button>
        <CustomButton href="https://discord.gg/torus">Join</CustomButton>
        <Button
          className="rounded-full bg-accent hover:bg-background disabled:opacity-100"
          onClick={onNetworkClick}
          variant="outline"
        >
          Network
        </Button>
      </motion.div>

      {/* Second Button Row */}
      <motion.div
        variants={buttonVariants}
        custom={0}
        className="flex w-full max-w-3xl justify-around gap-[4.6em]"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
      >
        <CustomButton href={links.wallet} isHidden={!showStarter}>
          Wallet
        </CustomButton>
        <CustomButton href={links.bridge} isHidden={!showStarter}>
          Bridge
        </CustomButton>
        <CustomButton href={links.docs} isHidden={!showNetwork}>
          Docs
        </CustomButton>
        <CustomButton href={links.allocator} isHidden={!showNetwork}>
          Allocator
        </CustomButton>
      </motion.div>

      {/* Third Button Row */}
      <motion.div
        variants={buttonVariants}
        custom={2}
        className="absolute mt-20 flex w-full max-w-[43rem] justify-around gap-36"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
      >
        <CustomButton
          href="https://mirror.xyz/0xF251922dcda31Bd4686485Be9A185a1B7807428E/NXi_M6QjhrEOtEkuWCbeEGR7UaYft0x2Kv5uOD4V6Bg"
          isHidden={!showStarter}
        >
          Blog
        </CustomButton>
        <CustomButton href={links.governance} isHidden={!showNetwork}>
          DAO
        </CustomButton>
      </motion.div>

      {/* Fourth Row with Card */}
      <motion.div
        variants={buttonVariants}
        custom={11}
        className="absolute w-full max-w-[46.5rem]"
        style={{ zIndex: isExpanded ? 1 : "auto" }}
        animate={{ top: cardPosition }}
        transition={{ duration: 0.4, delay: 0.1 }}
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
              className={cn(isExpanded ? "h-[calc(40vh)]" : "h-fit", "pr-2")}
            >
              <motion.div layout>
                Torus is an open-ended experiment to encode biology's principles
                of autonomy and self-organization into a L1 stake-anchored
                agentic protocol, perpetually producing novelty.
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
                      Torus is a self-assembling & self-evolving superorganism
                      composed of an emergent hypergraph of recursively
                      delegated onchain & offchain control permissions and
                      incentives among agents, anchored to the stake root, with
                      unbound specialization and optimization.
                    </p>
                    <p className="mt-3">
                      The graph forms a multi-scale competency architecture with
                      full autonomy at every level and open market selection at
                      every edge, bottom-up aligning towards the stake root,
                      able to maintain high-level coherence at increasing
                      organism complexity.
                    </p>
                    <p className="mt-3">
                      Stake is the organisms root container of authority and
                      monetary energy, transmutable towards its emergent agency.
                      Forming a circular value flow between incentives and stake
                      in their outcome.
                    </p>
                    <p className="mt-3">
                      Given the Torus hypergraph originates from the stake root,
                      alignment to stake is intrinsic at any scale. Selection
                      pressures at the root cascade down every path of the
                      graph. Reliably tethering the system to humanity.
                    </p>
                    <p className="mt-3">
                      The abstractions of control space, programmatic &
                      composable permissions, recursive delegation and agents,
                      expressed in one emergent fractal hypergraph, enable
                      arbitrarily complex & interwoven autonomous swarms to
                      assemble and co-evolve, while sharing organs and
                      functions.
                    </p>
                    <p className="mt-3">
                      The system has strong self-regulation capacity to retain
                      coherence admits adversarial presence and
                      paradigm-agnostic incentive programming can be applied at
                      any position in the graph.
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
