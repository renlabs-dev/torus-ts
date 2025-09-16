import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { generateMetadata } from "~/utils/seo";
import { Stake } from "./_components/stake/stake";
import { StakingCalculator } from "./_components/staking-calculator/staking-calculator";
import { TransferStake } from "./_components/transfer-stake/transfer-stake";
import { Unstake } from "./_components/unstake/unstake";

export const metadata = generateMetadata({
  title: "Staking - Torus Wallet",
  description: "Stake your tokens and earn rewards in the Torus ecosystem",
  ogTitle: "Staking - Torus Wallet",
  ogDescription: "Stake your tokens and earn rewards in the Torus ecosystem",
  twitterTitle: "Staking - Torus Wallet",
  twitterDescription:
    "Stake your tokens and earn rewards in the Torus ecosystem",
  canonical: "/staking",
  keywords: [
    "crypto wallet",
    "torus",
    "staking",
    "stake tokens",
    "earn rewards",
    "web3",
  ],
});

const tabs: TabItem[] = [
  { text: "Stake", component: <Stake /> },
  { text: "Unstake", component: <Unstake /> },
  { text: "Move", component: <TransferStake /> },
  { text: "APY Forecast", component: <StakingCalculator /> },
];

export default function StakingPage() {
  return <TabLayout tabs={tabs} defaultTab="stake" />;
}
