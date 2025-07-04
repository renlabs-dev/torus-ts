import { z } from "zod";
import { match } from "rustie";
import type { SS58Address } from "@torus-network/sdk";
import { SS58_SCHEMA } from "@torus-network/sdk";
import type { JWTErrorCode } from "./jwt-sr25519.js";
import { verifyJWT } from "./jwt-sr25519.js";

export const ensureTrailingSlash = (path: string) => {
  return path.startsWith("/") ? path : `/${path}`;
};

/**
 * Selects a random RPC URL from the provided list for load balancing.
 * If no URLs are provided or the list is empty, defaults to the Torus testnet endpoint.
 * @param rpcUrls - Optional array of RPC endpoint URLs
 * @returns A randomly selected RPC URL, defaults to 'wss://api.testnet.torus.network'
 */
export const selectRandomRpcUrl = (rpcUrls?: string[]): string => {
  const urls =
    rpcUrls && rpcUrls.length > 0
      ? rpcUrls
      : ["wss://api.testnet.torus.network"];
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

export type TokenData = z.infer<typeof TokenDataSchema>;

export type AuthErrorCode =
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
        if (payload.keyType !== 'sr25519') {
          return {
            success: false,
            error: `Unsupported key type: ${payload.keyType}`,
            code: "INVALID_FORMAT",
          };
        }

        if (payload.addressInfo.addressType !== 'ss58') {
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
