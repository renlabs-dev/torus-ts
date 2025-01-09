"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { TransferToken } from "../transfer-token";
import { TransferEVM } from "../transfer-evm";

const tabs = [
  { text: "Torus ⟷ Torus EVM", component: <TransferEVM /> },
  { text: "Torus EVM ⟷ Base", component: <TransferToken /> },
] as const;

function WalletOptions() {
  const [currentTab, setCurrentTab] = useState<string>(tabs[0].text);

  const ActionTabs: React.FC<{ text: string }> = (props) => {
    const { text } = props;

    return (
      <TabsTrigger onClick={() => setCurrentTab(text)} value={text}>
        {text}
      </TabsTrigger>
    );
  };

  return (
    <>
      <Tabs
        defaultValue={tabs[0].text}
        value={currentTab}
        className="flex w-full animate-fade flex-col gap-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <ActionTabs key={tab.text} text={tab.text} />
          ))}
        </TabsList>
        {tabs.map((tab) => {
          return (
            <TabsContent key={tab.text} value={tab.text}>
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
