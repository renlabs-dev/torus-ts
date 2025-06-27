"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { updateSearchParams } from "~/utils/query-params";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { TransferEVM } from "../transfer-evm";
import { TransferToken } from "../transfer-token";

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

  const handleTabChange = useCallback(
    (value: string) => {
      const updates: Record<string, string | null> = {};

      updates.tab = value;
      if (value === "torus") {
        updates.from = null;
        updates.to = null;
        updates.mode = "bridge";
      } else if (value === "base") {
        updates.mode = null;
        updates.from = "base";
        updates.to = "torus";
      }

      const newQuery = updateSearchParams(searchParams, updates);
      router.push("/?" + newQuery);
    },
    [searchParams, router],
  );

  useEffect(() => {
    const isValid = tabs.some((v) => v.params === currentTab);
    if (!isValid && defaultTab.params !== currentTab) {
      handleTabChange(defaultTab.params);
    }
  }, [currentTab, handleTabChange]);

  return (
    <Tabs
      value={
        tabs.find((tab) => tab.params === currentTab)?.params ??
        defaultTab.params
      }
      onValueChange={(value) => handleTabChange(value)}
      className="animate-fade flex w-full flex-col gap-4"
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
  );
}

export function WalletActions() {
  const searchParams = useSearchParams();

  const view = searchParams.get("view") as "wallet" | null;

  const routeComponents = {
    wallet: <WalletOptions />,
    // bridge: <BridgeAction />,
  };

  return routeComponents[view ?? "wallet"];
}

export default WalletActions;
