"use client";

import React from "react";

import type {
  InjectedAccountWithMeta,
  Stake,
  Transfer,
  TransferStake,
} from "@torus-ts/ui/types";
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui";

import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";

export interface GenericActionProps {
  balance: bigint | undefined;
  selectedAccount: InjectedAccountWithMeta;
  userStakeWeight: bigint | null;
}

export interface WalletActionsProps extends GenericActionProps {
  addStake: (stake: Stake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;
}

export function WalletActions(props: WalletActionsProps) {
  const buttons = [
    { text: "Send", component: <SendAction {...props} /> },
    { text: "Stake", component: <StakeAction {...props} /> },
    { text: "Unstake", component: <UnstakeAction {...props} /> },
    { text: "Transfer", component: <TransferStakeAction {...props} /> },
  ];

  return (
    <>
      <Tabs
        defaultValue={buttons[0]?.text}
        className="flex w-4/5 flex-col gap-4"
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
              <Card className="p-6">{button.component}</Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

export default WalletActions;
