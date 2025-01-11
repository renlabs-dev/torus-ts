"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { TransferToken } from "../transfer-token";
import { TransferEVM } from "../transfer-evm";
import { updateSearchParams } from "~/utils/query-params";

const tabs = [
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
] as const;

const defaultTab = tabs[0];

function WalletOptions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab");

  const handleTabChange = (value: string) => {
    const updates: Record<string, string | null> = {};

    if (value === "torus") {
      updates.from = null;
      updates.to = null;
    } else if (value === "base") {
      updates.mode = null;
    }

    updates.tab = value;
    const newQuery = updateSearchParams(searchParams, updates);
    router.push("/?" + newQuery);
  };

  useEffect(() => {
    if (!currentTab || !tabs.some((view) => view.params === currentTab)) {
      const newQuery = updateSearchParams(searchParams, {
        tab: defaultTab.params,
      });
      router.push(`/?${newQuery}`, { scroll: false });
    }
  }, [currentTab, router, searchParams]);

  return (
    <>
      <Tabs
        value={
          tabs.find((tab) => tab.params === currentTab)?.params ??
          defaultTab.params
        }
        onValueChange={(value) => handleTabChange(value)}
        className="flex w-full animate-fade flex-col gap-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.text}
              value={tab.params}
              onClick={() => handleTabChange(tab.params)}
            >
              {tab.text}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => {
          return (
            <TabsContent key={tab.params} value={tab.params}>
              {tab.component}
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

export function WalletActions() {
  const searchParams = useSearchParams();

  // const view = searchParams.get("view") as "wallet" | "bridge" | null;
  const view = searchParams.get("view") as "wallet" | null;

  const routeComponents = {
    wallet: <WalletOptions />,
    // bridge: <BridgeAction />,
  };

  return routeComponents[view ?? "wallet"];
}

export default WalletActions;
