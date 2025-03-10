import { links } from "@torus-ts/ui/lib/data";
import { env } from "~/env";

const apiLinks = links(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

export const ANIMATIONS = {
  DRAW: {
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
  },
  BUTTON: {
    hidden: { opacity: 0, y: -15 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: custom * 0.1 },
    }),
  },
  TEXT: {
    collapsed: { opacity: 0, height: 0 },
    expanded: { opacity: 1, height: "auto" },
  },
  CARD: {
    collapsed: { height: "auto" },
    expanded: { height: "auto" },
  },
  GLOW: {
    pulse: (scale: number) => ({
      scale: [scale, scale * 1.2, scale],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  },
};

export const CONTENT = {
  description: [
    "Torus is an open-ended experiment to encode biology's principles of autonomy and self-organization into a L1 stake-anchored agentic protocol, perpetually producing novelty.",
    "Torus is a self-assembling & self-evolving superorganism composed of an emergent hypergraph of recursively delegated onchain & offchain control permissions and incentives among agents, anchored to the stake root, with unbound specialization and optimization.",
    "The graph forms a multi-scale competency architecture with full autonomy at every level and open market selection at every edge, bottom-up aligning towards the stake root, able to maintain high-level coherence at increasing organism complexity.",
    "Stake is the organisms root container of authority and monetary energy, transmutable towards its emergent agency. Forming a circular value flow between incentives and stake in their outcome.",
    "Given the Torus hypergraph originates from the stake root, alignment to stake is intrinsic at any scale. Selection pressures at the root cascade down every path of the graph. Reliably tethering the system to humanity.",
    "The abstractions of control space, programmatic & composable permissions, recursive delegation and agents, expressed in one emergent fractal hypergraph, enable arbitrarily complex & interwoven autonomous swarms to assemble and co-evolve, while sharing organs and functions.",
    "The system has strong self-regulation capacity to retain coherence admits adversarial presence and paradigm-agnostic incentive programming can be applied at any position in the graph.",
    "Torus exhibits a continuous emergent process with increasingly complex multi-scale symbiotic relationships, capable of autonomous teleodynamic order and negentropic adaptation.",
  ],
  desktopButtons: {
    starter: [
      { text: "Wallet", href: apiLinks.wallet },
      { text: "Bridge", href: apiLinks.bridge },
      {
        text: "Blog",
        href: apiLinks.blog,
      },
    ],
    network: [
      { text: "Docs", href: apiLinks.docs },
      { text: "Allocator", href: apiLinks.allocator },
      { text: "DAO", href: apiLinks.governance },
    ],
    common: [{ text: "Join", href: apiLinks.discord }],
  },
  mobileButtons: [
    [
      { text: "Bridge", href: apiLinks.bridge },
      { text: "Wallet", href: apiLinks.wallet },
      {
        text: "Blog",
        href: apiLinks.blog,
      },
    ],
    [
      { text: "DAO", href: apiLinks.governance },
      { text: "Allocator", href: apiLinks.allocator },
      { text: "Docs", href: apiLinks.docs },
    ],
    [{ text: "Join", href: apiLinks.discord }],
  ],
};
