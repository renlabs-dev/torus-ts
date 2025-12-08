import { blake2AsHex, signatureVerify } from "@polkadot/util-crypto";
import { checkSS58 } from "@torus-network/sdk/types";
import type { PermissionCacheService } from "@torus-ts/api/services/permission-cache";
import canonicalize from "canonicalize";
import type { Elysia } from "elysia";
import { z } from "zod";
import { HttpError } from "../utils/errors";

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

type ParsedAuthHeaders = z.infer<typeof authHeadersSchema>;

export const authPlugin = (app: Elysia) =>
  app
    .guard({
      headers: authHeadersSchema,
    })
    .resolve({ as: "scoped" }, ({ headers }) => {
      const parsedHeaders = headers as unknown as ParsedAuthHeaders;
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
      const verification = signatureVerify(
        payloadHash,
        signature,
        agentAddress,
      );

      if (!verification.isValid) {
        throw new HttpError(
          401,
          "Invalid signature: signature does not match payload or was not signed by the claimed address",
        );
      }

      return { userKey: agentAddress };
    });

export type AuthApp = ReturnType<typeof authPlugin>;

export const requirePermission =
  (namespacePaths: string[], permissionCache: PermissionCacheService) =>
  (app: Elysia) =>
    app
      .use(authPlugin)
      .decorate("permissionCache", permissionCache)
      .onBeforeHandle(
        { as: "scoped" },
        ({ permissionCache, userKey, status }) => {
          for (const path of namespacePaths) {
            const hasPermission = permissionCache.hasPermission(userKey, path);

            if (!hasPermission) {
              return status(403, `Permission denied: requires ${path}`);
            }
          }
        },
      );
