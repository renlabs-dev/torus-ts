"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Suspense, useState } from "react";
import { WalletSkeletonLoader } from "~/app/components/wallet-skeleton-loader";
import { StakeAction } from "./_components/stake";
import { StakingCalculator } from "./_components/staking-calculator";
import { TransferStakeAction } from "./_components/transfer-stake";
import { UnstakeAction } from "./_components/unstake";

type TabType = "stake" | "unstake" | "move" | "apy";

const tabs = [
  { text: "Stake", value: "stake", component: <StakeAction /> },
  { text: "Unstake", value: "unstake", component: <UnstakeAction /> },
  { text: "Move", value: "move", component: <TransferStakeAction /> },
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
