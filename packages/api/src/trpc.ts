/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import type { ApiPromise } from "@polkadot/api";
import type { SS58Address } from "@torus-network/sdk";
import { setup } from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { createDb } from "@torus-ts/db/client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { assert } from "tsafe";
import { z, ZodError } from "zod";
import type { SessionData } from "./auth";
import { decodeSessionToken } from "./auth";

let globalDb: ReturnType<typeof createDb> | null = null;
let globalWSAPI: ApiPromise | null = null;

const getEnv = validateEnvOrExit({
  NEXT_PUBLIC_TORUS_RPC_URL: z
    .string()
    .nonempty("TORUS_CURATOR_MNEMONIC is required"),
});

function cacheCreateDb() {
  globalDb = globalDb ?? createDb();
  return globalDb;
}

async function cacheCreateWSAPI() {
  globalWSAPI =
    globalWSAPI ?? (await setup(getEnv(process.env).NEXT_PUBLIC_TORUS_RPC_URL));
  return globalWSAPI;
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 */
export interface TRPCContext {
  db: ReturnType<typeof createDb>;
  authType?: string;
  sessionData: SessionData | null;
  jwtSecret: string;
  authOrigin: string;
  allocatorAddress: SS58Address;
  wsAPI: Promise<ApiPromise>;
}

// Context for authenticated procedures
export interface AuthenticatedTRPCContext extends TRPCContext {
  sessionData: SessionData; // Non-nullable
}

export const createTRPCContext = (opts: {
  headers: Headers;
  session: null;
  jwtSecret: string;
  authOrigin: string;
  allocatorAddress: SS58Address;
}) => {
  const db = cacheCreateDb();
  const wsAPI = cacheCreateWSAPI();

  const { jwtSecret } = opts;

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source);

  const [authType, authToken] = (
    opts.headers.get("authorization") ??
    opts.headers.get("Authorization") ??
    ""
  ).split(" ");

  let sessionData: SessionData | null = null;
  if (authToken) {
    try {
      sessionData = decodeSessionToken(authToken, jwtSecret);
      assert(sessionData.uri === opts.authOrigin);
    } catch (err: unknown) {
      console.error(`Failed to validate JWT: ${String(err)}`);
    }
  }

  return {
    db,
    authType,
    sessionData,
    jwtSecret,
    authOrigin: opts.authOrigin,
    allocatorAddress: opts.allocatorAddress,
    wsAPI,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 */

/**
 * This is how you create new routers and sub routers in your tRPC API
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure
 *
 * Requires authentication. Ensures ctx.sessionData is non-null.
 */
export const authenticatedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.authType) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must have an active session",
    });
  }
  if (opts.ctx.authType !== "Bearer") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or unsupported authentication type",
    });
  }
  if (!opts.ctx.sessionData?.userKey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  const authenticatedCtx: AuthenticatedTRPCContext = {
    ...opts.ctx,
    sessionData: opts.ctx.sessionData,
  };

  return opts.next({
    ctx: authenticatedCtx,
  });
});
