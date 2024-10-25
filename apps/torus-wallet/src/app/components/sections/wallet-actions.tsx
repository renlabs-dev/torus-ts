"use client";

import { IconButton } from "../icon-button";
import { SendAction } from "./actions/send";
import { StakeAction } from "./actions/stake";
import { TransferStakeAction } from "./actions/transfer-stake";
import { UnstakeAction } from "./actions/unstake";
import React, { useState } from "react";
import type { ColorType, MenuType } from "~/utils/types";
import type { Stake, Transfer, TransferStake, InjectedAccountWithMeta } from "@torus-ts/providers/types";

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
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);

  const buttons = [
    { src: "send-icon.svg", text: "Send", color: "red" },
    { src: "stake-icon.svg", text: "Stake", color: "amber" },
    { src: "unstake-icon.svg", text: "Unstake", color: "purple" },
    { src: "transfer-icon.svg", text: "Transfer Stake", color: "green" },
  ];

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-4 pt-4 animate-fade-up animate-delay-300 md:grid-cols-4">
        {buttons.map((button) => (
          <IconButton
            key={button.src}
            activeMenu={activeMenu}
            color={button.color as ColorType}
            setActiveMenu={setActiveMenu}
            src={button.src}
            text={button.text}
          />
        ))}
      </div>

      {activeMenu === "Send" && <SendAction {...props} />}
      {activeMenu === "Stake" && <StakeAction {...props} />}
      {activeMenu === "Unstake" && <UnstakeAction {...props} />}
      {activeMenu === "Transfer Stake" && <TransferStakeAction {...props} />}
    </>
  );
}

export default WalletActions;
