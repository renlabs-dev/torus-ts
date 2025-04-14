"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { WalletSkeletonLoader } from "./wallet-skeleton-loader";

export interface TabItem {
  text: string;
  value: string;
  component: ReactNode;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab: string;
}

export function TabLayout({ tabs, defaultTab }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <div className="container mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
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
