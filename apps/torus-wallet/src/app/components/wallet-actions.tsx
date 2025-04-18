"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import * as React from "react";
import { useState } from "react";
import { ReceiveAction } from "./actions/receive";
import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { StakingCalculator } from "./actions/staking-calculator";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";

const transferButtons = [
  { text: "Send", component: <SendAction /> },
  { text: "Receive", component: <ReceiveAction /> },
];

const stakingButtons = [
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Move", component: <TransferStakeAction /> },
  { text: "APY Forecast", component: <StakingCalculator /> },
];

interface WalletOptionsProps {
  buttons: { text: string; component: React.ReactNode }[];
}

function WalletOptions({ buttons }: Readonly<WalletOptionsProps>) {
  const [currentTab, setCurrentTab] = useState(buttons[0]?.text);

  const ActionTabs: React.FC<{ text: string }> = ({ text }) => {
    return (
      <TabsTrigger onClick={() => setCurrentTab(text)} value={text}>
        {text}
      </TabsTrigger>
    );
  };

  return (
    <Tabs
      defaultValue={buttons[0]?.text}
      value={currentTab}
      className="animate-fade flex w-full flex-col gap-4"
    >
      <TabsList
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}
      >
        {buttons.map((button) => (
          <ActionTabs key={button.text} text={button.text} />
        ))}
      </TabsList>
      {buttons.map((button) => (
        <TabsContent key={button.text} value={button.text}>
          {button.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}

interface WalletActionProps {
  route: "transfer" | "staking";
}

export function WalletActions({ route }: WalletActionProps) {
  const routeComponents = {
    transfer: <WalletOptions buttons={transferButtons} />,
    staking: <WalletOptions buttons={stakingButtons} />,
  };

  return routeComponents[route];
}

export default WalletActions;
