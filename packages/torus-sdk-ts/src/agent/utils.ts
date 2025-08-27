import { match } from "rustie";
import { z } from "zod";

import type { SS58Address } from "../types/index.js";
import { SS58_SCHEMA } from "../types/index.js";

import type { JWTErrorCode } from "./jwt-sr25519.js";
import { verifyJWT } from "./jwt-sr25519.js";

export const ensureTrailingSlash = (path: string) => {
  return path.startsWith("/") ? path : `/${path}`;
};

/**
 * Selects a random RPC URL from the TORUS_RPC_URLS environment variable or
 * default to mainnet (`wss://api.torus.network`).
 *
 * `TORUS_RPC_URLS` is a comma-separated list of RPC URLs, e.g.,
 * `wss://api.torus.network,wss://api.tor.us`.
 */
export const selectRpcUrl = (): string => {
  const envRpcUrls = process.env.TORUS_RPC_URLS;

  const urls = envRpcUrls
    ? envRpcUrls.split(",").map((url) => url.trim())
    : ["wss://api.torus.network"];

  const randomIndex = Math.floor(Math.random() * urls.length);
  const selectedRpcUrl = urls[randomIndex];
  if (!selectedRpcUrl) {
    // should never happen
    throw new Error("No RPC URLs found");
  }
  return selectedRpcUrl;
};

const TokenDataSchema = z.object({
  userWalletAddress: z
    .string()
    .refine((val): val is SS58Address => SS58_SCHEMA.safeParse(val).success, {
      message: "Invalid SS58 address",
    })
    .describe("SS58 encoded address"),
  userPublicKey: z.string().describe("SR25519 public key in hex format"),
});

type TokenData = z.infer<typeof TokenDataSchema>;

type AuthErrorCode =
  | JWTErrorCode
  | "MISSING_AUTH_HEADERS"
  | "UNSUPPORTED_AUTH_METHOD"
  | "RATE_LIMITED"
  | "INSUFFICIENT_STAKE"
  | "NAMESPACE_ACCESS_DENIED";

export type AuthTokenResult =
  | { success: true; data: TokenData }
  | { success: false; error: string; code: AuthErrorCode };

export const decodeAuthToken = (
  token: string,
  maxAge?: number,
): AuthTokenResult => {
  try {
    const verificationResult = verifyJWT(token, maxAge);

    return match(verificationResult)({
      Error: (error): AuthTokenResult => ({
        success: false,
        error: error.error,
        code: error.code,
      }),
      Success: (result): AuthTokenResult => {
        const { payload } = result;

        // TODO: better parsing of formats
        if (payload.keyType !== "sr25519") {
          return {
            success: false,
            error: `Unsupported key type: ${payload.keyType}`,
            code: "INVALID_FORMAT",
          };
        }

        if (payload.addressInfo.addressType !== "ss58") {
          return {
            success: false,
            error: `Unsupported address type: ${payload.addressInfo.addressType}`,
            code: "INVALID_FORMAT",
          };
        }

        const tokenData = {
          userWalletAddress: payload.sub,
          userPublicKey: payload.publicKey,
        };

        const tokenDataParsed = TokenDataSchema.safeParse(tokenData);
        if (!tokenDataParsed.success) {
          return {
            success: false,
            error: "Invalid token payload format",
            code: "INVALID_FORMAT",
          };
        }

        return {
          success: true,
          data: tokenDataParsed.data,
        };
      },
    });
  } catch (error) {
    return {
      success: false,
      error: `JWT verification failed: ${error instanceof Error ? error.message : String(error)}`,
      code: "INVALID_FORMAT",
    };
  }
};
