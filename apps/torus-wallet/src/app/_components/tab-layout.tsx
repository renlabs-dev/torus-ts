"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { WalletSkeletonLoader } from "./wallet-skeleton-loader";

export interface TabItem {
  text: string;
  component: ReactNode;
  hidden?: boolean;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab: string;
}

export function TabLayout({ tabs, defaultTab }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabElements = tabs.map((tab) => {
    const value = tab.text.toLowerCase();

    return {
      trigger: (
        <TabsTrigger key={value} value={value}>
          {tab.text}
        </TabsTrigger>
      ),
      content: (
        <TabsContent key={value} value={value}>
          {tab.component}
        </TabsContent>
      ),
    };
  });

  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <div className="container mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="animate-fade flex w-full flex-col gap-4"
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
            }}
          >
            {tabElements.map((el) => el.trigger)}
          </TabsList>
          {tabElements.map((el) => el.content)}
        </Tabs>
      </div>
    </Suspense>
  );
}
