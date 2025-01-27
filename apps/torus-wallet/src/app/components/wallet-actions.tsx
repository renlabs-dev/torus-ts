"use client";

import React, { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";
import { useWallet } from "@torus-ts/features/context/wallet-provider";

const buttons = [
  { text: "Send", component: <SendAction /> },
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Move Stake", component: <TransferStakeAction /> },
];

const unstakeRelatedActions = [
  buttons[1]?.text,
  buttons[2]?.text,
  buttons[3]?.text,
];

function WalletOptions() {
  const { accountStakedBy, selectedAccount } = useWallet();
  const [currentTab, setCurrentTab] = useState(buttons[0]?.text);

  const userHasNotStaked = accountStakedBy.data?.length === 0;

  const ActionTabs: React.FC<{ text: string }> = (props) => {
    const { text } = props;

    return (
      <TabsTrigger onClick={() => setCurrentTab(text)} value={text}>
        {text}
      </TabsTrigger>
    );
  };

  useEffect(() => {
    if (userHasNotStaked && unstakeRelatedActions.includes(currentTab)) {
      setCurrentTab(buttons[0]?.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.address, userHasNotStaked]);

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
