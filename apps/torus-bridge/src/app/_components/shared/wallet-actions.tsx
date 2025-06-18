"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import React, { useCallback, useEffect, useMemo } from "react";
import { updateSearchParams } from "~/utils/query-params";
import { TransferEVM } from "../transfer-evm";
import { TransferToken } from "../transfer-token";

type TabId = "torus" | "base";
type ViewType = "wallet";

interface TabConfig {
  text: string;
  component: React.ReactNode;
  params: TabId;
}

type TabUpdates = Record<string, string | null>;

const TABS: readonly TabConfig[] = [
  {
    text: "Torus ⟷ Torus EVM",
    component: <TransferEVM />,
    params: "torus",
  },
  {
    text: "Torus EVM ⟷ Base",
    component: <TransferToken />,
    params: "base",
  },
];

const DEFAULT_TAB = TABS[0];

const getTabUpdates = (tabId: TabId): TabUpdates => {
  const baseUpdates: TabUpdates = {
    tab: tabId,
    from: null,
    to: null,
    mode: null,
  };

  if (tabId === "torus") {
    return {
      ...baseUpdates,
      mode: "bridge",
    };
  }

  return {
    ...baseUpdates,
    from: "torus",
    to: "base",
  };
};

function WalletOptions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") as TabId | null;

  const handleTabChange = useCallback(
    (value: string) => {
      const updates = getTabUpdates(value as TabId);
      const newQuery = updateSearchParams(searchParams, updates);
      router.push(`/?${newQuery}`);
    },
    [searchParams, router],
  );

  const isValidTab = useMemo(
    () => TABS.some((tab) => tab.params === currentTab),
    [currentTab],
  );

  useEffect(() => {
    if (!isValidTab && currentTab !== DEFAULT_TAB?.params) {
      handleTabChange(DEFAULT_TAB?.params ?? "");
    }
  }, [currentTab, handleTabChange, isValidTab]);

  const activeTab = useMemo(
    () =>
      TABS.find((tab) => tab.params === currentTab)?.params ??
      DEFAULT_TAB?.params ??
      "",
    [currentTab],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="animate-fade flex w-full flex-col gap-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.params}
            value={tab.params}
            onClick={() => handleTabChange(tab.params)}
          >
            {tab.text}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.params} value={tab.params}>
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}

type RouteComponents = Record<ViewType, JSX.Element>;

const isValidViewType = (value: string | null): value is ViewType =>
  value === "wallet";

export function WalletActions() {
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view");

  const view: ViewType = isValidViewType(rawView) ? rawView : "wallet";

  const routeComponents: RouteComponents = useMemo(
    () => ({
      wallet: <WalletOptions />,
    }),
    [],
  );

  return routeComponents[view];
}
