"use client";

import { useTimeout } from "@hyperlane-xyz/widgets";
import { Loading } from "@torus-ts/ui/components/loading";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useReadyMultiProvider } from "~/hooks/use-ready-multi-provider";

const INIT_TIMEOUT = 10_000; // 10 seconds

// A wrapper app to delay rendering children until the warp context is ready
export function WarpContextInitGateProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
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
        <div className="min-w-screen flex min-h-screen items-center justify-center">
          <Loading /> Loading Bridge...
        </div>
      );
    }
  }

  return <>{children}</>;
}
