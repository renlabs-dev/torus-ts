# tRPC Client Configuration Pattern

This document explains the recommended pattern for configuring tRPC clients in Next.js applications within the Torus monorepo, including solutions for common issues with React 19, Next.js 16, and browser developer tools.

## Background

### The Problem

When using tRPC with Next.js 16 and React 19, several issues can cause the tRPC client to malfunction:

1. **Client recreation on every render** - Creating the tRPC client inside a React component without memoization causes it to be recreated on each render, which can corrupt tRPC's internal Proxy state.

2. **React DevTools interference** - React DevTools introspects all objects in React's component tree, including tRPC's Proxy-based client. This introspection can break the Proxy and cause `TypeError: client[procedureType] is not a function`.

3. **React Compiler incompatibility** - The React Compiler optimizes property access in ways that conflict with JavaScript Proxy handlers, breaking tRPC's proxy-based API.

4. **Peer dependency resolution** - In pnpm monorepos, `@trpc/client` must be explicitly declared as a dependency, not just relied upon as a transitive peer dependency.

### Symptoms

```
TypeError: client[procedureType] is not a function
    at createTRPCClient.ts:148:20
    at Object.apply (createProxy.ts:51:14)
```

Additional symptoms:

- Client-side navigation stops working
- Page appears to load but links don't respond
- React DevTools shows semver-related errors

## Solution: Singleton Pattern

### Recommended Implementation

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@torus-ts/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import SuperJSON from "superjson";

// 1. Create QueryClient with singleton pattern
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
  }
  clientQueryClientSingleton ??= createQueryClient();
  return clientQueryClientSingleton;
};

// 2. Create tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// 3. Helper functions outside React component
const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return `http://localhost:3000`;
};

// 4. Singleton for tRPC client (browser only)
let trpcClientSingleton: ReturnType<typeof api.createClient> | undefined;

function createTRPCClientInstance() {
  return api.createClient({
    links: [
      httpBatchLink({
        url: getBaseUrl() + "/api/trpc",
        transformer: SuperJSON,
      }),
    ],
  });
}

// 5. Provider component with singleton initialization
export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // useState ensures client is created only once per component mount
  const [trpcClient] = useState(() => {
    if (typeof window === "undefined") {
      // Server-side: create new instance each time (SSR isolation)
      return createTRPCClientInstance();
    }
    // Client-side: use singleton to prevent recreation
    if (!trpcClientSingleton) {
      trpcClientSingleton = createTRPCClientInstance();
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
```

### Key Points

| Pattern                               | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `let trpcClientSingleton`             | Prevents client recreation across re-renders  |
| `useState(() => ...)`                 | Lazy initialization, runs only once per mount |
| `typeof window === "undefined"` check | Different behavior for SSR vs client          |
| Helper functions outside component    | Prevents recreation and closure issues        |

## Required Configuration

### 1. Package Dependencies

Explicitly declare all tRPC peer dependencies in your app's `package.json`:

```json
{
  "dependencies": {
    "@trpc/client": "catalog:",
    "@trpc/react-query": "catalog:",
    "@tanstack/react-query": "catalog:"
  }
}
```

### 2. pnpm Catalog Versions

Ensure the pnpm workspace catalog uses stable versions (not RC):

```yaml
# pnpm-workspace.yaml
catalog:
  "@trpc/client": ^11.5.0
  "@trpc/react-query": ^11.5.0
  "@trpc/server": ^11.5.0
  "@tanstack/react-query": ^5.51.23
```

### 3. Next.js Configuration

Disable React Compiler for apps using tRPC:

```js
// next.config.mjs
const config = {
  // Disabled: React Compiler breaks tRPC proxy-based APIs
  // reactCompiler: true,
  // ... other config
};
```

## With Authentication

When the tRPC client requires dynamic dependencies (like wallet signing), pass them through the singleton factory:

```tsx
let trpcClientSingleton: ReturnType<typeof api.createClient> | undefined;

function createTRPCClientInstance(
  signHex: (
    msgHex: `0x${string}`,
  ) => Promise<{ signature: `0x${string}`; address: string }>,
) {
  const getStoredAuthorization = () => localStorage.getItem("authorization");
  const setStoredAuthorization = (auth: string) =>
    localStorage.setItem("authorization", auth);

  const authenticateUser = makeAuthenticateUserFn(
    getBaseUrl(),
    env("NEXT_PUBLIC_AUTH_ORIGIN"),
    setStoredAuthorization,
    signHex,
  );

  return api.createClient({
    links: [
      createAuthLink(authenticateUser, getStoredAuthorization),
      httpBatchLink({
        url: getBaseUrl() + "/api/trpc",
        headers() {
          const authorization = localStorage.getItem("authorization");
          return authorization ? { authorization } : {};
        },
        transformer: SuperJSON,
      }),
    ],
  });
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { signHex } = useTorus();

  const [trpcClient] = useState(() => {
    if (typeof window === "undefined") {
      return createTRPCClientInstance(signHex);
    }
    if (!trpcClientSingleton) {
      trpcClientSingleton = createTRPCClientInstance(signHex);
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
```

## Troubleshooting

### Error: `client[procedureType] is not a function`

1. **Test in incognito mode** - Disables React DevTools
2. **Disable React Compiler** - Add `// reactCompiler: true,` to next.config.mjs
3. **Check singleton pattern** - Ensure `useState` is used for client initialization
4. **Verify dependencies** - Run `pnpm why @trpc/client` to check resolution

### Navigation Not Working

This usually means React failed to hydrate due to a JavaScript error:

1. Check browser console for errors
2. The tRPC error blocks React from initializing client-side routing
3. Fix the tRPC error first, navigation will work after

### After Dependency Updates

```sh
# Clean reinstall
rm -rf node_modules apps/YOUR_APP/.next
pnpm install
```

## References

- [React DevTools Proxy crash - GitHub #21654](https://github.com/facebook/react/issues/21654)
- [tRPC v10 to v11 Migration Guide](https://trpc.io/docs/migrate-from-v10-to-v11)
- [tRPC Discord: Next.js procedureType error](https://discord-questions.trpc.io/m/1221402424405790780)
