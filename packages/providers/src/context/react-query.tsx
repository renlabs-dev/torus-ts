"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // throwOnError: true, // TODO
      },
    },
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
}

export function ReactQueryProvider(props: {
  children: React.ReactNode;
}): JSX.Element {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
