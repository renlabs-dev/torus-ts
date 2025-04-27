import type { AuthReq } from "@torus-network/torus-utils/auth";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { createSessionToken } from "../auth";
import { SIGNED_PAYLOAD_SCHEMA, verifySignedData } from "../auth/sign";
import { publicProcedure } from "../trpc";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

// Maps nonce -> timestamp
const seenNonces = new Map<string, number>();
let lastNonceCleanup = Date.now();

export const authRouter = {
  startSession: publicProcedure
    .input(SIGNED_PAYLOAD_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const [verifyError, verifyResult] = await tryAsync(
        verifySignedData(input),
      );
      if (verifyError !== undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid signed payload: ${verifyError.message}`,
          cause: verifyError,
        });
      }

      const { address, payload } = verifyResult;

      const [authError] = trySync(() =>
        verifyAuthRequest(payload, ctx.authOrigin),
      );
      if (authError !== undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid authentication request: ${authError.message}`,
          cause: authError,
        });
      }

      const [tokenError, token] = trySync(() =>
        createSessionToken(
          {
            userKey: address,
            uri: payload.uri,
          },
          ctx.jwtSecret,
        ),
      );

      if (tokenError !== undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session token",
          cause: tokenError,
        });
      }

      return { token, authenticationType: "Bearer" };
    }),

  checkSession: publicProcedure
    .input(z.object({ auth: z.string() }))
    .mutation(({ ctx, input }) => {
      const [_authType, authToken] = input.auth.split(" ");

      const [verifyError, decodedPayload] = trySync(() =>
        jwt.verify(authToken ?? "", ctx.jwtSecret),
      );

      if (verifyError !== undefined) {
        return {
          isValid: false,
          decodedPayload: null,
        };
      }

      return {
        isValid: true,
        decodedPayload,
      };
    }),
} satisfies TRPCRouterRecord;

/**
 * Checks if the user request for a session token is valid.
 */
function verifyAuthRequest(data: AuthReq, authOrigin: string) {
  if (data.uri !== authOrigin) {
    throw new Error(`Invalid origin: ${data.uri}`);
  }

  // Check if the session data is not older than 10 minutes
  if (new Date(data.created).getTime() + 10 * 60 * 1000 < Date.now()) {
    throw new Error("Session data is too old");
  }

  if (seenNonces.has(data.nonce)) {
    throw new Error("Nonce has been used before");
  }

  seenNonces.set(data.nonce, Date.now());

  // Cleanup old nonces every hour
  const HOUR = 60 * 60 * 1000;
  if (lastNonceCleanup + HOUR < Date.now()) {
    for (const [nonce, timestamp] of seenNonces.entries()) {
      if (timestamp + HOUR < Date.now()) {
        seenNonces.delete(nonce);
      }
    }
    lastNonceCleanup = Date.now();
  }
}
