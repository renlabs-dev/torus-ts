"use client";

import { WalletActionsBase, ActionButton } from "@torus-ts/ui/components/wallet-common";
import { ReceiveAction } from "./actions/receive";
import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { StakingCalculator } from "./actions/staking-calculator";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";

const transferButtons: ActionButton[] = [
  { text: "Send", component: <SendAction /> },
  { text: "Receive", component: <ReceiveAction /> },
];

const stakingButtons: ActionButton[] = [
  { text: "Stake", component: <StakeAction /> },
  { text: "Unstake", component: <UnstakeAction /> },
  { text: "Move", component: <TransferStakeAction /> },
  { text: "APY Forecast", component: <StakingCalculator /> },
];

interface WalletActionProps {
  route: "transfer" | "staking";
}

export function WalletActions({ route }: WalletActionProps) {
  const buttons = route === "transfer" ? transferButtons : stakingButtons;
  
  return (
    <WalletActionsBase 
      buttons={buttons} 
      defaultTab={buttons[0]?.text}
      className="animate-fade flex w-full flex-col gap-4"
    />
  );
}

export default WalletActions;
