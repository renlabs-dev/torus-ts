"use client";

import React from "react";
import { CornerLeftUp, CornerRightUp } from "lucide-react";

import { Loading } from "@torus-ts/ui";

import { useTorus } from "@torus-ts/torus-provider";

export function IntroSection() {
  const { selectedAccount, isInitialized, accounts } = useTorus();

  if (!isInitialized || !accounts)
    return (
      <div className="absolute inset-0 z-50 mx-auto flex min-h-full w-full max-w-screen-xl animate-fade items-center justify-center py-1 text-xl backdrop-blur-sm delay-200">
        <Loading size={35} />
      </div>
    );

  if (!selectedAccount) {
    return (
      <div className="absolute inset-0 z-[70] mx-auto flex min-h-full w-full max-w-screen-xl animate-fade items-start justify-end py-1 backdrop-blur-sm delay-200">
        <div className="mr-20 mt-12 flex items-center gap-3 animate-duration-[1500ms]">
          <CornerLeftUp size={22} className="mb-3 flex animate-pulse" />
          <span className="flex animate-pulse text-base">
            Connect your wallet
          </span>
          <CornerRightUp size={22} className="mb-3 flex animate-pulse" />
        </div>
      </div>
    );
  }
  return null;
}
