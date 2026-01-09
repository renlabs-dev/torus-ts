"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@torus-ts/api";
import { createAuthLink, makeAuthenticateUserFn } from "@torus-ts/api/client";
import { useTorus } from "@torus-ts/torus-provider";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { env } from "~/env";
import { useEffect, useRef, useState } from "react";
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

function createTRPCClientInstance(
  signHex: (
    msgHex: `0x${string}`,
  ) => Promise<{ signature: `0x${string}`; address: string }>,
) {
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

  // Use a ref to always have access to the latest signHex function
  // This prevents stale closures when selectedAccount changes
  const signHexRef = useRef(signHex);

  // Keep the ref updated with the latest signHex
  useEffect(() => {
    signHexRef.current = signHex;
  }, [signHex]);

  // Create a stable wrapper that delegates to the current signHex
  const stableSignHex = useRef(async (msgHex: `0x${string}`) =>
    signHexRef.current(msgHex),
  ).current;

  // Use useState to ensure client is created only once per mount
  // eslint-disable-next-line react-hooks/refs
  const [trpcClient] = useState(() => {
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
