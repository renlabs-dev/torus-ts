"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";
import { StakingCalculator } from "./staking-calculator";

const buttons = [
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Move Stake", component: <TransferStakeAction /> },
  { text: "Calculator", component: <StakingCalculator /> },
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
        <TabsList className="grid w-full grid-cols-4">
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
  const routeComponents = {
    wallet: <WalletOptions />,
  };

  return routeComponents.wallet;
}

export default WalletActions;
