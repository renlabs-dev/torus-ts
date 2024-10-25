import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@torus-ts/api";

import { env } from "~/env";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: null,
    headers: heads,
    jwtSecret: env.JWT_SECRET,
    authOrigin: env.AUTH_ORIGIN,
  });
});

export const api = createCaller(createContext);
