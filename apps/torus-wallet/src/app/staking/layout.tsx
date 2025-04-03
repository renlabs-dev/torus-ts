"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Suspense, useState } from "react";
import { WalletSkeletonLoader } from "~/app/components/wallet-skeleton-loader";
import { StakingCalculator } from "./_components/staking-calculator/staking-calculator";
import { Stake } from "./_components/stake/stake";
import { Unstake } from "./_components/unstake/unstake";
import { TransferStake } from "./_components/transfer-stake/transfer-stake";

type TabType = "stake" | "unstake" | "move" | "apy";

const tabs = [
  { text: "Stake", value: "stake", component: <Stake /> },
  { text: "Unstake", value: "unstake", component: <Unstake /> },
  { text: "Move", value: "move", component: <TransferStake /> },
  { text: "APY Forecast", value: "apy", component: <StakingCalculator /> },
];

export default function StakingLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("stake");

  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <div className="container mx-auto p-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="animate-fade flex w-full flex-col gap-4"
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
            }}
          >
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.text}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Suspense>
  );
}
