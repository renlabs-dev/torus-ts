"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@torus-ts/api";
import { createAuthLink, makeAuthenticateUserFn } from "@torus-ts/api/client";
import { useTorus } from "@torus-ts/torus-provider";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { env } from "~/env";
import { useEffect, useState } from "react";
import SuperJSON from "superjson";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  } else {
    clientQueryClientSingleton ??= createQueryClient();
    return clientQueryClientSingleton;
  }
};

export const api = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return `http://localhost:3004`;
};

// Create a singleton tRPC client outside React
let trpcClientSingleton: ReturnType<typeof api.createClient> | undefined;

type SignHexFn = (
  msgHex: `0x${string}`,
) => Promise<{ signature: `0x${string}`; address: string }>;

// Module-level reference to the latest signHex from the torus provider,
// so the tRPC singleton always delegates to the current wallet context
// instead of closing over the initial (null) selectedAccount.
let latestSignHex: SignHexFn | null = null;

function createTRPCClientInstance(signHex: SignHexFn) {
  const getStoredAuthorization = () => localStorage.getItem("authorization");
  const setStoredAuthorization = (authorization: string) =>
    localStorage.setItem("authorization", authorization);

  const authenticateUser = makeAuthenticateUserFn(
    getBaseUrl(),
    env("NEXT_PUBLIC_AUTH_ORIGIN"),
    setStoredAuthorization,
    signHex,
  );

  return api.createClient({
    links: [
      createAuthLink(authenticateUser, getStoredAuthorization),
      loggerLink({
        enabled: (op) =>
          env("NEXT_PUBLIC_NODE_ENV") === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: getBaseUrl() + "/api/trpc",
        headers() {
          const headers: Record<string, string> = {};
          headers["x-trpc-source"] = "nextjs-react";
          const authorization = localStorage.getItem("authorization");
          if (authorization) {
            headers.authorization = authorization;
          }
          return headers;
        },
        transformer: SuperJSON,
      }),
    ],
  });
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { signHex } = useTorus();

  // Keep the module-level signHex in sync so the tRPC singleton always
  // delegates to the latest wallet context (avoids stale closure).
  useEffect(() => {
    latestSignHex = signHex;
  });

  // Use useState to ensure client is created only once per mount
  const [trpcClient] = useState(() => {
    const stableSignHex: SignHexFn = (msgHex) => {
      if (!latestSignHex) throw new Error("signHex not initialized");
      return latestSignHex(msgHex);
    };

    if (typeof window === "undefined") {
      // Server-side: create new instance each time
      return createTRPCClientInstance(stableSignHex);
    }
    // Client-side: use singleton
    if (!trpcClientSingleton) {
      trpcClientSingleton = createTRPCClientInstance(stableSignHex);
    }
    return trpcClientSingleton;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}
