"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {},
    },
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();
  return clientQueryClientSingleton;
}

export function ReactQueryProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
