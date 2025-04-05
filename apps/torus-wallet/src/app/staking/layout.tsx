"use client";

import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { StakingCalculator } from "./_components/staking-calculator/staking-calculator";
import { Stake } from "./_components/stake/stake";
import { Unstake } from "./_components/unstake/unstake";
import { TransferStake } from "./_components/transfer-stake/transfer-stake";

const tabs: TabItem[] = [
  { text: "Stake", value: "stake", component: <Stake /> },
  { text: "Unstake", value: "unstake", component: <Unstake /> },
  { text: "Move", value: "move", component: <TransferStake /> },
  { text: "APY Forecast", value: "apy", component: <StakingCalculator /> },
];

export default function StakingLayout() {
  return <TabLayout tabs={tabs} defaultTab="stake" />;
}
