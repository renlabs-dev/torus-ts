"use client";

import { Suspense, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Receive } from "~/app/transfers/_components/receive";
import { Send } from "~/app/transfers/_components/send";
import { WalletSkeletonLoader } from "~/app/components/wallet-skeleton-loader";

type TabType = "send" | "receive";

const tabs = [
  { text: "Send", value: "send", component: <Send /> },
  { text: "Receive", value: "receive", component: <Receive /> },
];

export default function TransfersLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("send");

  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <div className="container mx-auto">
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
