import { blake2AsHex, signatureVerify } from "@polkadot/util-crypto";
import { checkSS58 } from "@torus-network/sdk/types";
import canonicalize from "canonicalize";
import { Elysia } from "elysia";
import { z } from "zod";
import { HttpError } from "../utils/errors";
import type { ContextApp } from "./context";

const authHeadersSchema = z.object({
  "x-agent-address": z.string().transform((val) => checkSS58(val)),
  "x-signature": z.string().min(1, "Signature is required"),
  "x-timestamp": z.string().transform((val) => {
    const timestamp = new Date(val);
    if (isNaN(timestamp.getTime())) {
      throw new Error("Invalid timestamp format");
    }
    return timestamp;
  }),
});

export const authPlugin = new Elysia({ name: "auth" })
  .guard({
    headers: authHeadersSchema,
  })
  .resolve({ as: "global" }, ({ headers }) => {
    const parsedHeaders = authHeadersSchema.parse(headers);
    const agentAddress = parsedHeaders["x-agent-address"];
    const signature = parsedHeaders["x-signature"];
    const timestamp = parsedHeaders["x-timestamp"];

    const now = new Date();
    const maxTimestampDiffMs = 300 * 1000;
    const diffMs = Math.abs(now.getTime() - timestamp.getTime());

    if (diffMs > maxTimestampDiffMs) {
      throw new HttpError(
        401,
        `Invalid timestamp: ${Math.floor(diffMs / 1000)}s off (max ${maxTimestampDiffMs / 1000}s allowed)`,
      );
    }

    const payload = {
      address: agentAddress,
      timestamp: timestamp.toISOString(),
    };

    const payloadCanonical = canonicalize(payload);
    if (!payloadCanonical) {
      throw new HttpError(500, "Failed to canonicalize auth payload");
    }

    const payloadHash = blake2AsHex(payloadCanonical);
    const verification = signatureVerify(payloadHash, signature, agentAddress);

    if (!verification.isValid) {
      throw new HttpError(
        401,
        "Invalid signature: signature does not match payload or was not signed by the claimed address",
      );
    }

    return { userKey: agentAddress };
  });

export type AuthApp = typeof authPlugin;

export const requirePermission =
  (namespacePaths: string[]) => (app: ContextApp) =>
    app
      .use(authPlugin)
      .onBeforeHandle(
        { as: "global" },
        ({ permissionCache, userKey, status }) => {
          for (const path of namespacePaths) {
            const hasPermission = permissionCache.hasPermission(userKey, path);

            if (!hasPermission) {
              return status(403, `Permission denied: requires ${path}`);
            }
          }
        },
      );
