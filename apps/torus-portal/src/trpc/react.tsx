"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@torus-ts/api";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { env } from "~/env";
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

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const trpcClient = api.createClient({
    links: [
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
  return `http://localhost:3004}`;
};
