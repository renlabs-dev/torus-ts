import type { SS58Address } from "@torus-network/sdk/types";
import { createCaller, createTRPCContext } from "@torus-ts/api";
import { env } from "~/env";
import { headers } from "next/headers";
import { cache } from "react";

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
    allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS") as SS58Address,
    swarmMnemonic: env("TORUS_WALLET_SEED_PHRASE"),
    swarmApiUrl: env("NEXT_PUBLIC_API_BASE_URL"),
    predictionAppAddress: env("PREDICTION_APP_ADDRESS"),
  });
});

export const api = createCaller(createContext);
