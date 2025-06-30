import { z } from "zod";
import { match } from "rustie";
import { type SS58Address, SS58_SCHEMA } from "@torus-network/sdk";
import { verifyJWT, type JWTErrorCode } from "./jwt-sr25519.js";

export const ensureTrailingSlash = (path: string) => {
  return path.startsWith("/") ? path : `/${path}`;
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
  | 'MISSING_AUTH_HEADERS'
  | 'UNSUPPORTED_AUTH_METHOD'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_STAKE';

export type AuthTokenResult = 
  | { success: true; data: TokenData }
  | { success: false; error: string; code: AuthErrorCode };




export const decodeAuthToken = (token: string, maxAge?: number): AuthTokenResult => {
  try {
    const verificationResult = verifyJWT(token, maxAge);
    
    return match(verificationResult)({
      Error: (error): AuthTokenResult => ({
        success: false,
        error: error.error,
        code: error.code
      }),
      Success: (result): AuthTokenResult => {
        const { payload } = result;
        
        const tokenData = {
          userWalletAddress: payload.sub,
          userPublicKey: payload.publicKey,
        };

        const tokenDataParsed = TokenDataSchema.safeParse(tokenData);
        if (!tokenDataParsed.success) {
          return {
            success: false,
            error: "Invalid token payload format", 
            code: 'INVALID_FORMAT'
          };
        }

        return {
          success: true,
          data: tokenDataParsed.data
        };
      }
    });
  } catch (error) {
    return {
      success: false,
      error: `JWT verification failed: ${error instanceof Error ? error.message : String(error)}`,
      code: 'INVALID_FORMAT'
    };
  }
};

