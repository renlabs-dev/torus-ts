"use client";

import {
  getDefaultConfig,
  midnightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { env } from "~/env";
import { torusEvm } from "~/lib/chain";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";

function makeWagmiConfig() {
  return getDefaultConfig({
    appName: "Torus Migration Claim",
    projectId: env("NEXT_PUBLIC_WALLET_CONNECT_ID") || "dev-placeholder",
    chains: [torusEvm],
    transports: { [torusEvm.id]: http() },
    ssr: true,
  });
}

function makeSsrWagmiConfig() {
  return createConfig({
    chains: [torusEvm],
    transports: { [torusEvm.id]: http() },
    ssr: true,
  });
}

function makeInitialWagmiConfig() {
  if (typeof window === "undefined") {
    return makeSsrWagmiConfig();
  }

  return makeWagmiConfig();
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function EvmWalletProvider({ children }: Readonly<PropsWithChildren>) {
  const [wagmiConfig] = useState(makeInitialWagmiConfig);
  const [queryClient] = useState(makeQueryClient);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={midnightTheme({
            accentColor: "#A7AFBE",
            borderRadius: "small",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
