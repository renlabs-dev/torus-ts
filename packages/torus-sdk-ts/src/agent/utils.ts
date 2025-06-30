import { sr25519Verify } from "@polkadot/util-crypto";
import { type SS58Address, SS58_SCHEMA } from "@torus-network/sdk";
import { z } from "zod";
import { match } from "rustie";
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

const ProtocolMetadataSchema = z.object({
  version: z.string(),
});

const RequestDataSchema = z.object({
  userWalletAddress: z
    .string()
    .refine((val): val is SS58Address => SS58_SCHEMA.safeParse(val).success, {
      message: "Invalid SS58 address",
    })
    .describe("SS58 encoded address"),
  userPublicKey: z.string(),
  method: z.string(),
  path: z.string(),
  timestamp: z.number(),
  _protocol_metadata: ProtocolMetadataSchema,
});

export type TokenData = z.infer<typeof TokenDataSchema>;

export type AuthErrorCode = 
  | JWTErrorCode
  | 'SIGNATURE_INVALID'
  | 'SIGNATURE_EXPIRED'
  | 'MISSING_AUTH_HEADERS'
  | 'UNSUPPORTED_AUTH_METHOD'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_STAKE';

export type AuthTokenResult = 
  | { success: true; data: TokenData }
  | { success: false; error: string; code: AuthErrorCode };

export type ProtocolMetadata = z.infer<typeof ProtocolMetadataSchema>;

export type RequestData = z.infer<typeof RequestDataSchema>;

const CURRENT_PROTOCOL_VERSION = "1.0.0";
const SUPPORTED_PROTOCOL_VERSIONS = ["1.0.0"];

export const validateRequestSignature = (
  signature: string,
  requestData: RequestData,
): RequestData | null => {
  try {
    if (
      !SUPPORTED_PROTOCOL_VERSIONS.includes(
        requestData._protocol_metadata.version,
      )
    ) {
      throw new Error(
        `Unsupported protocol version: ${requestData._protocol_metadata.version}`,
      );
    }

    const now = Date.now();
    const maxAge = 5 * 60 * 1000;
    if (now - requestData.timestamp > maxAge) {
      throw new Error("Request timestamp too old");
    }

    const message = new TextEncoder().encode(JSON.stringify(requestData));
    const signatureBuffer = Buffer.from(signature, "hex");
    const publicKeyBuffer = new Uint8Array(
      Buffer.from(requestData.userPublicKey, "hex"),
    );

    const isValid = sr25519Verify(message, signatureBuffer, publicKeyBuffer);

    return isValid ? requestData : null;
  } catch (error) {
    console.error("Signature validation error:", error);
    return null;
  }
};

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

export const getCurrentProtocolVersion = () => CURRENT_PROTOCOL_VERSION;
