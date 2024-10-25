import {
  ChartBarIcon,
  CircleStackIcon,
  CubeIcon,
  GiftTopIcon,
  ScaleIcon,
  ServerStackIcon,
  ShareIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  SquaresPlusIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";

export const sections = [
  {
    sectionName: "modular",
    title: "Modular",
    subtitle: "Composable architecture",
    iconSrc: "/reusability-icon.svg",
    features: [
      {
        description:
          "torus follows a modular, reusable and minimal architecture philosophy, able to quickly add, adapt and compose parts of the system on the fly.",
        icon: SquaresPlusIcon,
      },
      {
        description:
          "torus assumes to be continually innovated and build upon through the DAO, making a scalable and robust architecture a foundational requirement.",
        icon: ShareIcon,
      },
    ],
  },
  {
    sectionName: "parallel",
    title: "Parallel",
    subtitle: "Horizontal scaling",
    iconSrc: "/scalability-icon.svg",
    features: [
      {
        description:
          "Subnets and other economic applications run and scale in parallel, allowing to host highly specialized and complimentary mechanisms",
        icon: ServerStackIcon,
      },
    ],
  },
  {
    sectionName: "offchain",
    title: "Offchain",
    subtitle: "Any mechanism on any compute",
    iconSrc: "/tokenomics-icon.svg",
    features: [
      {
        description:
          "The blockchain is only responsible for the economic information. all mechanisms and applications build on torus run offchain without constraints.",
        icon: CircleStackIcon,
      },
      {
        description:
          "This allows subnets and applications to be arbitrarily complex and computationally expensive, without facing blockchain limitations.",
        icon: SparklesIcon,
      },
    ],
  },
  {
    sectionName: "decentralized",
    title: "Decentralized",
    subtitle: `No foundation, only DAO`,
    iconSrc: "/validators-icon.svg",
    features: [
      {
        description: `All changes to torus are decided collectively by the DAO. No central authority has full control over the Protocol.`,
        icon: ShieldCheckIcon,
      },
      {
        description: `DAO participation is incentivized to motivate holders to take part in deciding their destiny.`,
        icon: ScaleIcon,
      },
    ],
  },
  {
    sectionName: "bottom-up",
    title: "Bottom up",
    subtitle: `No central team`,
    iconSrc: "/validators-icon.svg",
    features: [
      {
        description: `There was never any bureaucracy or rigid hierarchy, torus was birthed out of cypherpunk ideals.`,
        icon: SignalIcon,
      },
      {
        description: `Anyone can become a core contributor and grow to wield big impact. Ideas efficiently rise from the bottom up to implementation.`,
        icon: UsersIcon,
      },
    ],
  },
  {
    sectionName: "tokenomics",
    title: "Tokenomics",
    subtitle: `No Premine`,
    iconSrc: "/tokenomics-icon.svg",
    features: [
      {
        description: `torus is continuously optimizing the allocation of emissions to create positive sum competitions.`,
        icon: ChartBarIcon,
      },
      {
        description: `The current standard framework is a 50/50 reward split between miners and validators. miners compete to optimize or solve what validators define. validators evaluate the performance of miners.`,
        icon: CubeIcon,
      },
      {
        description: `Rewards are distributed every 100 blocks, with a block time of 8 seconds.`,
        icon: GiftTopIcon,
      },
    ],
  },
];
