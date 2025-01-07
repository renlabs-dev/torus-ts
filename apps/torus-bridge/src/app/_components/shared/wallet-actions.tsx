"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { TransferToken } from "../transfer-token";
import { TransferEVM } from "../transfer-evm";

const buttons = [
  { text: "Bridge (Torus EVM - Base wTorus)", component: <TransferToken /> },
  { text: "EVM (Torus - Torus EVM)", component: <TransferEVM /> },
];

function WalletOptions() {
  const [currentTab, setCurrentTab] = useState(buttons[0]?.text);

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
        defaultValue={buttons[0]?.text}
        value={currentTab}
        className="flex w-full animate-fade flex-col gap-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          {buttons.map((button) => (
            <ActionTabs key={button.text} text={button.text} />
          ))}
        </TabsList>
        {buttons.map((button) => {
          return (
            <TabsContent key={button.text} value={button.text}>
              {button.component}
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
