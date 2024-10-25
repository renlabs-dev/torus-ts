import Link from "next/link";

import { links } from "@torus-ts/ui/data";

interface HyperLink {
  children?: React.ReactNode;
  href: string;
}

function Hyperlink(props: HyperLink): JSX.Element {
  const { children, href } = props;

  return (
    <Link
      className="text-green-500 hover:underline"
      href={href}
      target="_blank"
    >
      {children}
    </Link>
  );
}

export const faqData = [
  {
    question: "What is torusAI and its philosophy?",
    answer:
      "torusAI is a censorship resistant peer to peer protocol leveraging crypto economic incentives for the decentralized creation and access of machine intelligence and other digital commodities. torus follows a radically OpenSource and modular design philosophy centered around cooperation, sharing and reusability of resources.",
  },
  {
    question: "Who is founder of torusAI?",
    answer:
      "torusAI follows a zero bureaucracy only code, zero founders only developers philosophy and is community driven at its heart. That being said, originator and core developer is Sal Vivona, a physicist and machine learning engineer who quit big tech 3 years ago to fulltime focus on torus. He discovered Bittensor and joined the OpenTensor foundation as a developer until he eventually quit to pursue torus fully again.",
  },
  {
    question: "What makes torus unusual compared to other projects?",
    answer:
      "torus is cypherpunk at heart, wild and fully organic. There is no bureaucracy, foundation or VCs. only open source code and developers making public contributions.",
  },
  {
    question: "How can AI and Blockchain work together at scale on torus?",
    answer: `torus's blockchain only tracks the economic information of the AI activity rather than the AI activity itself. The AI validation happens off chain and only its results are submitted to the chain. This separates the computation heavy elements from the chain.`,
  },
  {
    question: "What is the utility of $COMAI?",
    answer:
      "COMAI Validator Stake controls the incentive landscape of miners. Stake is essentially ownership over the workforce of miners, making them compete around serving the demands of Stakeholders with supply. Giving Stake access to an ever changing and growing array of digital commodities like AI.",
  },
  {
    question: "What are the tokenomics of $COMAI?",
    answer:
      "COMAI launched fairly without pre-mine, meaning the founder mines in the open network like everyone else. Emissions are split 50/50 between validators and miners. validators earn dividends on stake for producing evaluations of miners, while miners earn incentive by receiving good evaluations from validators.",
  },
  {
    question: "What is the emission schedule for $COMAI?",
    answer:
      "Halving happen every 250m mined coins, first halving is on 19th december 2025.",
  },
  {
    question: "What is the current token emission?",
    answer: `Token emission is dynamic and depends on Rootnet's subnet allocation. Although there is a daily upper limit of 250,000 tokens, the current emission is approximately 70,000 new tokens per day, primarily due to Rootnet DAO recycling.`,
  },
  {
    question: "What is the total supply of COMAI tokens?",
    answer: `It's 1 billion.`,
  },
  {
    question: "How can I get started?",
    answer: (
      <span>
        Please refer to our{" "}
        <Hyperlink href="https://torusai.org/docs/getting-started/intro">
          introduction page
        </Hyperlink>{" "}
        where you can find all details.
      </span>
    ),
  },
  {
    question: "What is the roadmap of torus?",
    answer: `torus is emerging in a decentralized manner, meaning it is formed by the contributions of many different independent people who commit code or try to convince the community to implement an idea. This makes the conventional concept of a roadmap unapplicable. However the goal for the community will always be to increase the prosperity of the protocol by improving its mechanisms and the value produced by miners and validators, while keeping it as fair and decentralized as possible. So at large we will likely always work towards that direction.`,
  },
  {
    question: "How can I help?",
    answer: (
      <span>
        There are many creative ways to help torus, join our{" "}
        <Hyperlink href={links.discord}>Discord</Hyperlink> and start a
        discussion!{" "}
      </span>
    ),
  },
];
