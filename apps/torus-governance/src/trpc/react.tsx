"use client";

// TODO: modularize
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@torus-ts/api";
import { createAuthLink, makeAuthenticateUserFn } from "@torus-ts/api/client";
import { useTorus } from "@torus-ts/torus-provider";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { env } from "~/env";
import SuperJSON from "superjson";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // throwOnError: true, // TODO
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

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const { signHex } = useTorus();

  const getStoredAuthorization = () => localStorage.getItem("authorization");
  const setStoredAuthorization = (authorization: string) =>
    localStorage.setItem("authorization", authorization);

  const authenticateUser = makeAuthenticateUserFn(
    getBaseUrl(),
    env("NEXT_PUBLIC_AUTH_ORIGIN"),
    setStoredAuthorization,
    signHex,
  );

  const trpcClient = api.createClient({
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return `http://localhost:${env("PORT") ?? 3000}`;
};
