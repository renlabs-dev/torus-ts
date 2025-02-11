import { headers } from "next/headers";
import { cache } from "react";

import { createCaller, createTRPCContext } from "@torus-ts/api";

import { env } from "~/env";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: null,
    headers: heads,
    jwtSecret: env("JWT_SECRET"),
    authOrigin: env("NEXT_PUBLIC_AUTH_ORIGIN"),
    allocatorAddress: env("TORUS_ALLOCATOR_ADDRESS"),
  });
});

export const api = createCaller(createContext);
