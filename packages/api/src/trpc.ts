/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import type { ApiPromise } from "@polkadot/api";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { assert } from "tsafe";
import { z, ZodError } from "zod";

import type { SS58Address } from "@torus-network/sdk/types";
import { connectToChainRpc } from "@torus-network/sdk/utils";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { trySync } from "@torus-network/torus-utils/try-catch";

import { createDb } from "@torus-ts/db/client";

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
    globalWSAPI ??
    (await connectToChainRpc(getEnv(process.env).NEXT_PUBLIC_TORUS_RPC_URL));
  return globalWSAPI;
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
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

export interface AuthenticatedTRPCContext extends TRPCContext {
  sessionData: SessionData;
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

  // Get authorization header with fallback
  const authHeader =
    opts.headers.get("authorization") ??
    opts.headers.get("Authorization") ??
    "";

  // Parse authorization header
  const [authType, authToken, ...rest] = authHeader.trim().split(" ");
  if (rest.length !== 0) {
    console.warn("Unexpected extra segments in the Authorization header");
  }
  let sessionData: SessionData | null = null;

  if (authToken) {
    // Use trySync for decoding and validating the token
    const [decodeError, decodedToken] = trySync(() =>
      decodeSessionToken(authToken, jwtSecret),
    );

    if (decodeError !== undefined) {
      console.error(`Failed to decode JWT: ${decodeError.message}`);
    } else if (decodedToken) {
      const [validateError] = trySync(() => {
        if (decodedToken.uri !== opts.authOrigin) {
          assert(
            decodedToken.uri === opts.authOrigin,
            `URI mismatch: ${decodedToken.uri} !== ${opts.authOrigin}`,
          );
        }
      });

      if (validateError !== undefined) {
        console.error(`Failed to validate JWT: ${validateError.message}`);
      } else {
        sessionData = decodedToken;
      }
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
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and sub routers in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure
 *
 * This is a procedure that requires authentication to be accessed.
 * header: { Authorization: "Bearer <token>" }
 *
 * if the token is valid, the user will always be available in the context as `ctx.user`.
 *
 * If the token is invalid, expired, or the user is not found, it will throw an error.
 */
export const authenticatedProcedure = t.procedure.use(async (opts) => {
  // Check for auth type existence
  const [authTypeError] = trySync(() => {
    if (!opts.ctx.authType) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must have an active session",
      });
    }
  });

  if (authTypeError !== undefined) {
    throw authTypeError;
  }

  const [authTypeMatchError] = trySync(() => {
    if (opts.ctx.authType !== "Bearer") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or unsupported authentication type",
      });
    }
  });

  if (authTypeMatchError !== undefined) {
    throw authTypeMatchError;
  }

  const [sessionDataError, _] = trySync(() => {
    if (!opts.ctx.sessionData?.userKey) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token, error in session data",
      });
    }
  });

  if (sessionDataError !== undefined) {
    throw sessionDataError;
  }

  const [ctxError, authenticatedCtx] = trySync<AuthenticatedTRPCContext>(() => {
    if (!opts.ctx.sessionData) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
    return {
      ...opts.ctx,
      sessionData: opts.ctx.sessionData,
    };
  });

  if (ctxError !== undefined) {
    console.error("Failed to create authenticated context:", ctxError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create authenticated context",
    });
  }

  // Return with context
  return opts.next({
    ctx: authenticatedCtx,
  });
});
