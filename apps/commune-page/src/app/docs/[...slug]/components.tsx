import Link from "next/link";

interface CardProps {
  title: string;
  description: string;
  link: string;
}

function Card({ title, description, link }: CardProps): JSX.Element {
  const cardStyle =
    "flex flex-col justify-between px-6 pb-6 border border-gray-500 rounded-xl md:w-full";
  return (
    <div className={cardStyle}>
      <h3 className="pt-4">{title}</h3>
      <p>{description}</p>
      <Link
        className="text-sm font-bold no-underline hover:underline"
        href={link}
      >
        View More
      </Link>
    </div>
  );
}

function CardList({ data }: { data: CardProps[] }): JSX.Element {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:flex-row 2xl:grid-cols-4">
        {data.map((card) => (
          <Card key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

export function StartCards(): JSX.Element {
  return <CardList data={startCardsData} />;
}

export function BasicsCards(): JSX.Element {
  return <CardList data={basicsCardsData} />;
}

export function SubnetCards(): JSX.Element {
  return <CardList data={subnetCardsData} />;
}

export function SubnetListCards(): JSX.Element {
  return <CardList data={subnetListCardsData} />;
}

export function SubnetTemplateCards(): JSX.Element {
  return <CardList data={subnetTemplateCardsData} />;
}

const startCardsData = [
  {
    title: "Install",
    description:
      "Set up your commune and wallet to start participating in the network.",
    link: "/docs/installation/setup-commune",
  },
  {
    title: "Learn the Concepts",
    description:
      "Understand the basics of the network, weight system, governance, and more.",
    link: "/docs/concepts/basics",
  },
  {
    title: "Code Documentation",
    description:
      "Learn the structure of Commune AI source code, and how to contribute.",
    link: "https://docs.communex.ai/communex",
  },
  {
    title: "Watch Videos",
    description:
      "Watch tutorials and guides on how to operate within the Commune AI network.",
    link: "https://www.youtube.com/@project_eden_ai/videos",
  },
];

const basicsCardsData = [
  {
    title: "Mining basics",
    description:
      "How to mine, create a miner, deploy a miner, register a miner.",
    link: "/docs/mining/what-is-mining",
  },
  {
    title: "Validating basics",
    description:
      "How to validate, create a validator, deploy a validator, register a validator.",
    link: "/docs/mining/what-is-validating",
  },
  {
    title: "Subnets basics",
    description:
      "What are subnets, making a subnet, deploying a subnet, subnet parameters, types of subnets.",
    link: "/docs/subnets/what-is-a-subnet",
  },
  {
    title: "Module basics",
    description:
      "What are modules, deploying, registering, and connecting to them.",
    link: "/docs/modules/what-is-a-module",
  },
  {
    title: "Weights basics",
    description: "What are weights, how do they work, how to set weights.",
    link: "/docs/concepts/weight-system",
  },
  {
    title: "Governance Basics",
    description:
      "Operate on testnet, run a local node, learn network parameters, learn consensus.",
    link: "/docs/subspace/commune-blockchain",
  },
];

const subnetCardsData = [
  {
    title: "Subnet Template",
    description:
      "Look at the Github Subnet template, to learn how to build a subnet.",
    link: "https://github.com/renlabs-dev/commune-subnet-template",
  },
];

const subnetListCardsData = [
  {
    title: "General Subnet",
    description: "The general subnet, designed for human validation.",
    link: "/docs/subnets/general-subnet-dao",
  },
  {
    title: "Mosaic Subnet",
    description: "Instantly visualize your ideas.",
    link: "https://mosaicx.org/",
  },
  {
    title: "Synthia",
    description:
      "Continuous stream of synthetic training data with verified quality at scale.",
    link: "https://github.com/renlabs-dev/synthia",
  },
];

const subnetTemplateCardsData = [
  {
    title: "See Subnet Template",
    description: "See an example of how to structure your subnet code.",
    link: "/docs/subnets/subnet-template",
  },
];
