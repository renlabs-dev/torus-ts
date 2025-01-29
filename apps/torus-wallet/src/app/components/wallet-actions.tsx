"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";
import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";
import { ReceiveAction } from "./actions/receive";

const transferButtons = [
  { text: "Send", component: <SendAction /> },
  { text: "Receive", component: <ReceiveAction /> },
];

const stakingButtons = [
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Transfer Stake", component: <TransferStakeAction /> },
];

interface WalletOptionsProps {
  buttons: { text: string; component: JSX.Element }[];
}

function WalletOptions({ buttons }: WalletOptionsProps): JSX.Element {
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
      className="flex w-full animate-fade flex-col gap-4"
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

export function WalletActions({ route }: WalletActionProps): JSX.Element {
  const routeComponents = {
    transfer: <WalletOptions buttons={transferButtons} />,
    staking: <WalletOptions buttons={stakingButtons} />,
  };

  return routeComponents[route];
}

export default WalletActions;
