"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@torus-ts/api";
import { createAuthLink, makeAuthenticateUserFn } from "@torus-ts/api/client";
import { useTorus } from "@torus-ts/providers/use-torus";

import { env } from "~/env";

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
    if (!clientQueryClientSingleton) {
      clientQueryClientSingleton = createQueryClient();
    }
    return clientQueryClientSingleton;
  }
};

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const { signHex } = useTorus();

  const getStoredAuthorization = () => localStorage.getItem("authorization");
  const setStoredAuthorization = (authorization: string) =>
    localStorage.setItem("authorization", authorization);

  const authenticateUser = makeAuthenticateUserFn(
    getBaseUrl(),
    env.NEXT_PUBLIC_AUTH_ORIGIN,
    setStoredAuthorization,
    signHex,
  );

  const trpcClient = api.createClient({
    links: [
      createAuthLink(authenticateUser, getStoredAuthorization),
      loggerLink({
        enabled: (op) =>
          env.NODE_ENV === "development" ||
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

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};
