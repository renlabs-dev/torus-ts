"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { BridgeAction } from "./actions/bridge";
import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";

const buttons = [
  { text: "Send", component: <SendAction /> },
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Transfer", component: <TransferStakeAction /> },
];

function WalletOptions() {
  return (
    <>
      <Tabs
        defaultValue={buttons[0]?.text}
        className="flex w-full animate-fade flex-col gap-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          {buttons.map((button) => (
            <TabsTrigger key={button.text} value={button.text}>
              {button.text}
            </TabsTrigger>
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
  const view = searchParams.get("view") as "wallet" | "bridge" | null;

  const routeComponents = {
    wallet: <WalletOptions />,
    bridge: <BridgeAction />,
  };

  return routeComponents[view ?? "wallet"];
}

export default WalletActions;
