"use client";

import React from "react";
import { SendAction } from "./actions/send";

export function WalletActions() {
  return (
    <div className="w-full animate-fade">
      <SendAction />
    </div>
  );
}

export default WalletActions;
