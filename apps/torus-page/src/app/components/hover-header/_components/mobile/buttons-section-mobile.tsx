import Link from "next/link";
import { motion } from "framer-motion";
import { CircleDotDashed, Diameter } from "lucide-react";
import { Button, Card, cn, links, ScrollArea } from "@torus-ts/ui";

const buttonVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: custom * 0.1 },
  }),
};

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

const CustomButton: React.FC<ButtonProps> = ({ href, children }) => (
  <Button
    variant="outline"
    size="lg"
    asChild
    className="h-10 w-28 bg-background"
  >
    <Link href={href} target="_blank">
      {children}
    </Link>
  </Button>
);

export function ButtonsSectionMobile() {
  const buttonRows = [
    {
      delay: 11,
      className: "flex flex-col gap-6",
      buttons: [
        {
          text: "DAO",
          href: links.governance,
        },
        { text: "Docs", href: links.docs },
        {
          text: "Blog",
          href: "https://mirror.xyz/0xF251922dcda31Bd4686485Be9A185a1B7807428E/NXi_M6QjhrEOtEkuWCbeEGR7UaYft0x2Kv5uOD4V6Bg",
        },
      ],
    },
    {
      delay: 11,
      className: "flex flex-col gap-6",
      buttons: [
        {
          text: "Bridge",
          href: links.bridge,
        },
        { text: "Wallet", href: links.wallet },
        { text: "Allocator", href: links.allocator },
      ],
    },
  ];

  return (
    <motion.div
      className="absolute top-44 flex w-full justify-center"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* First Button */}
      <motion.div
        variants={buttonVariants}
        custom={5}
        className="absolute bottom-[3.8em] flex w-full max-w-[42rem] items-center justify-around gap-[12.5em]"
      >
        <div className="full flex h-12 w-12 items-center justify-center rounded-full bg-border">
          <CircleDotDashed className="h-6 w-6" />
        </div>
        <div className="absolute top-8">
          <CustomButton href="https://discord.gg/torus">Join</CustomButton>
        </div>
        <div className="full flex h-12 w-12 items-center justify-center rounded-full bg-border">
          <Diameter className="h-6 w-6" />
        </div>
      </motion.div>

      {/* First Row of Buttons */}
      <div className="absolute flex w-full justify-around px-12">
        {buttonRows.map((row, index) => (
          <motion.div
            key={index}
            variants={buttonVariants}
            custom={row.delay}
            className={row.className}
          >
            {row.buttons.map((button, buttonIndex) => (
              <CustomButton key={buttonIndex} href={button.href}>
                {button.text}
              </CustomButton>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Second Row With Card */}
      <motion.div
        variants={buttonVariants}
        custom={10}
        className="absolute mt-52 w-full max-w-[46.5rem]"
      >
        <Card className="mx-5 cursor-pointer overflow-hidden pb-4 pl-6 pr-4 pt-2 md:mx-0">
          <ScrollArea className={cn("h-[calc(33vh)]")}>
            <motion.div layout>
              <p className="mt-3">
                Torus is an open-ended experiment to encode biology's principles
                of autonomy, adaptive inference and self-organization into a
                stake-anchored agentic protocol, perpetually producing novelty.
              </p>
              <p className="mt-3">
                Torus is a self-assembling & self-evolving p2p monetary organism
                composed of an emergent multi-graph of recursively delegated
                onchain & offchain control permissions and incentives among
                agents, with arbitrarily complex and granular emergent
                specialization.
              </p>
              <p className="mt-3">
                The graph forms an agency-centric multi-scale competency
                architecture with full autonomy at every level and open market
                selection at every edge, bottom-up aligning towards the stake
                root, able to maintain high-level coherence at increasing
                organism complexity.
              </p>
              <p className="mt-3">
                Stake is the organisms container for monetary energy,
                transmutable towards its emergent agency. Forming a circular
                value flow between incentives and stake in their outcome.
              </p>
              <p className="mt-3">
                The abstractions of control space, permissions, recursive
                programmatic delegation and agents, expressed in an emergent
                multi-graph, enable rich incentive programming with enough
                self-regulation capacity to retain system coherence admits
                adversarial presence.
              </p>
              <p className="mt-3">
                Torus exhibits a continuous emergent process with increasingly
                complex multi-scale symbiotic relationships, capable of
                autonomous teleodynamic order and negentropic adaptation.
              </p>
            </motion.div>
          </ScrollArea>
        </Card>
      </motion.div>
    </motion.div>
  );
}
