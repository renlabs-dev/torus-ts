"use client";

import { SpinnerIcon, useTimeout } from "@hyperlane-xyz/widgets";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useReadyMultiProvider } from "~/hooks/use-ready-multi-provider";

const INIT_TIMEOUT = 20_000; // 20 seconds

// A wrapper app to delay rendering children until the warp context is ready
export function WarpContextInitGateProvider({
  children,
}: PropsWithChildren<unknown>) {
  const isWarpContextReady = !!useReadyMultiProvider();

  const [isTimedOut, setIsTimedOut] = useState(false);
  useTimeout(() => setIsTimedOut(true), INIT_TIMEOUT);

  if (!isWarpContextReady) {
    if (isTimedOut) {
      // Fallback to outer error boundary
      throw new Error(
        "Failed to initialize warp context. Please check your registry URL and connection status.",
      );
    } else {
      return (
        <div className="bg-primary-500 flex h-screen items-center justify-center">
          <SpinnerIcon
            width={80}
            height={80}
            color="#FFFFFF"
            className="opacity-50"
          />
        </div>
      );
    }
  }

  return <>{children}</>;
}
