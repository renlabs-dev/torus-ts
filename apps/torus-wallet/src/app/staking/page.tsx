import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { env } from "~/env";
import { Stake } from "./_components/stake/stake";
import { StakingCalculator } from "./_components/staking-calculator/staking-calculator";
import { TransferStake } from "./_components/transfer-stake/transfer-stake";
import { Unstake } from "./_components/unstake/unstake";

export const metadata = () =>
  createSeoMetadata({
    title: "Staking - Torus Wallet",
    description: "Stake your tokens and earn rewards in the Torus ecosystem",
    keywords: [
      "torus wallet",
      "torus staking",
      "torus staking calculator",
      "torus stake",
      "torus stake tokens",
      "torus unstake",
      "torus unstake tokens",
      "torus transfer tokens",
      "torus transfer stake",
    ],
    baseUrl: env("BASE_URL"),
    canonical: "/staking",
  });

const tabs: TabItem[] = [
  { text: "Stake", value: "stake", component: <Stake /> },
  { text: "Unstake", value: "unstake", component: <Unstake /> },
  { text: "Move", value: "move", component: <TransferStake /> },
  { text: "APY Forecast", value: "apy", component: <StakingCalculator /> },
];

export default function StakingPage() {
  return <TabLayout tabs={tabs} defaultTab="stake" />;
}
