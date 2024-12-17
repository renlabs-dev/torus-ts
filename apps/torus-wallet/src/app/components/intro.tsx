"use client";

import React from "react";
import { CornerRightUp } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";
import { Loading } from "@torus-ts/ui";

export function IntroSection() {
  const { selectedAccount, isInitialized, accounts } = useTorus();

  if (!isInitialized || !accounts)
    return (
      <div className="absolute inset-0 z-50 mx-auto hidden min-h-full w-full max-w-screen-xl animate-fade items-center justify-center py-1 text-xl backdrop-blur-sm delay-200 md:flex">
        <Loading size={35} />
      </div>
    );

  if (!selectedAccount) {
    return (
      <div className="absolute inset-0 z-50 mx-auto hidden min-h-full w-full max-w-screen-xl animate-fade items-start justify-end py-1 backdrop-blur-sm delay-200 md:flex">
        <span className="absolute right-5 top-2.5 h-1.5 w-1.5 rounded-full bg-muted" />
        <span className="absolute right-5 top-2.5 h-1.5 w-1.5 animate-ping rounded-full bg-muted-foreground animate-duration-[1500ms]" />
        <div className="mr-7 mt-12 flex animate-pulse items-center gap-3 animate-duration-[1500ms]">
          <span className="text-base">Connect your wallet</span>
          <CornerRightUp size={22} className="mb-3" />
        </div>
      </div>
    );
  }
  return null;
}
