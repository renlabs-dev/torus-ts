import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import type { AuthReq } from "@torus-ts/utils/auth";

import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { createSessionToken } from "../auth";
import { SIGNED_PAYLOAD_SCHEMA, verifySignedData } from "../auth/sign";
import { publicProcedure } from "../trpc";

// Maps nonce -> timestamp
const seenNonces = new Map<string, number>();
let lastNonceCleanup = Date.now();

export const authRouter = {
  startSession: publicProcedure
    .input(SIGNED_PAYLOAD_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      try {
        const { address, payload } = await verifySignedData(input);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Invalid signed payload: ${err}`,
          cause: err,
        });
      }

      try {
        verifyAuthRequest(payload, ctx.authOrigin);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Invalid authentication request: ${err}`,
          cause: err,
        });
      }

      const token = createSessionToken(
        {
          userKey: address,
          uri: payload.uri,
        },
        ctx.jwtSecret,
      );

      return { token, authenticationType: "Bearer" };
    }),
  checkSession: publicProcedure
    .input(z.object({ auth: z.string() }))
    .mutation(({ ctx, input }) => {
      const [_authType, authToken] = input.auth.split(" ");

      try {
        const decodedPayload = jwt.verify(authToken ?? "", ctx.jwtSecret);
        return {
          isValid: true,
          decodedPayload,
        };
      } catch {
        return {
          isValid: false,
          decodedPayload: null,
        };
      }
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
