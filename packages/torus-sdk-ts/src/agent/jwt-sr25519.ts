import { sr25519Verify, sr25519Sign } from "@polkadot/util-crypto";
import base64url from "base64url";
import { z } from "zod";

const CURRENT_PROTOCOL_VERSION = "1.0.0";
const SUPPORTED_PROTOCOL_VERSIONS = ["1.0.0"];

/**
 * Custom JWT algorithm implementation for SR25519 signatures.
 * Provides standard JWT compliance while using Substrate's SR25519 cryptography.
 */

export const getCurrentProtocolVersion = () => CURRENT_PROTOCOL_VERSION;

export const JWTHeaderSchema = z.object({
  alg: z.string(),
  typ: z.string(),
});

export const JWTPayloadSchema = z
  .object({
    sub: z.string().min(1, "Subject is required"),
    publicKey: z.string().regex(/^[0-9a-fA-F]+$/, "Public key must be hex"),
    iat: z.number().int().positive("Issued at must be positive integer"),
    exp: z.number().int().positive("Expiration must be positive integer"),
    nonce: z.string().uuid("Nonce must be a valid UUID"),
    _protocol_metadata: z.object({
      version: z.string().min(1, "Protocol version is required"),
    }),
  })
  .refine((data) => data.exp > data.iat, {
    message: "Expiration must be after issue time",
    path: ["exp"],
  });

export type JWTHeader = z.infer<typeof JWTHeaderSchema>;
export type SR25519JWTPayload = z.infer<typeof JWTPayloadSchema>;

export interface ProtocolMetadata {
  version: string;
}

export type JWTErrorCode =
  | "INVALID_FORMAT"
  | "UNSUPPORTED_ALGORITHM"
  | "MISSING_CLAIMS"
  | "EXPIRED"
  | "TOO_OLD"
  | "FUTURE_TOKEN"
  | "INVALID_SIGNATURE";

export type JWTVerificationResult =
  | {
      Success: {
        header: JWTHeader;
        payload: SR25519JWTPayload;
        signature: Uint8Array;
      };
    }
  | { Error: { error: string; code: JWTErrorCode } };

/**
 * Custom SR25519 JWT algorithm registry entry
 */
export const SR25519Algorithm = {
  name: "SR25519",

  /**
   * Signs a JWT message using SR25519
   */
  sign: (
    message: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array,
  ): Uint8Array => {
    const messageBuffer = new TextEncoder().encode(message);

    return sr25519Sign(messageBuffer, {
      publicKey,
      secretKey: privateKey,
    });
  },

  /**
   * Verifies a JWT signature using SR25519
   */
  verify: (
    message: string,
    signature: Uint8Array,
    publicKey: Uint8Array,
  ): boolean => {
    try {
      const messageBuffer = new TextEncoder().encode(message);
      return sr25519Verify(messageBuffer, signature, publicKey);
    } catch (error) {
      console.error("SR25519 verification error:", error);
      return false;
    }
  },
};

/**
 * Verifies and decodes a JWT token signed with SR25519
 * @param token - The JWT token to verify
 * @param maxAge - Maximum age of the token in seconds (if not provided, only checks expiration)
 * @returns Verification result or error details
 */
export function verifyJWT(
  token: string,
  maxAge?: number,
): JWTVerificationResult {
  try {
    // Parse JWT structure
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        Error: {
          error: "Invalid JWT format: must have 3 parts",
          code: "INVALID_FORMAT",
        },
      };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return {
        Error: {
          error: "Invalid JWT format: missing parts",
          code: "INVALID_FORMAT",
        },
      };
    }

    // Decode header
    const headerStr = base64url.default.decode(encodedHeader);
    const headerResult = JWTHeaderSchema.safeParse(JSON.parse(headerStr));
    if (!headerResult.success) {
      return {
        Error: {
          error: `Invalid JWT header: ${headerResult.error.message}`,
          code: "INVALID_FORMAT",
        },
      };
    }
    const header = headerResult.data;

    // Validate algorithm
    if (header.alg !== "SR25519") {
      return {
        Error: {
          error: `Unsupported algorithm: ${header.alg}`,
          code: "UNSUPPORTED_ALGORITHM",
        },
      };
    }

    if (header.typ !== "JWT") {
      return {
        Error: {
          error: `Unsupported token type: ${header.typ}`,
          code: "UNSUPPORTED_ALGORITHM",
        },
      };
    }

    // Decode payload
    const payloadStr = base64url.default.decode(encodedPayload);
    const payloadResult = JWTPayloadSchema.safeParse(JSON.parse(payloadStr));
    if (!payloadResult.success) {
      return {
        Error: {
          error: `Invalid JWT payload: ${payloadResult.error.message}`,
          code: "INVALID_FORMAT",
        },
      };
    }
    const payload = payloadResult.data;

    if (
      !SUPPORTED_PROTOCOL_VERSIONS.includes(payload._protocol_metadata.version)
    ) {
      return {
        Error: {
          error: `Unsupported protocol version: ${payload._protocol_metadata.version}`,
          code: "UNSUPPORTED_ALGORITHM",
        },
      };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { Error: { error: "Token has expired", code: "EXPIRED" } };
    }

    if (payload.iat > now + 60) {
      return {
        Error: { error: "Token used before issue time", code: "FUTURE_TOKEN" },
      };
    }

    if (maxAge !== undefined) {
      const tokenAge = now - payload.iat;
      if (tokenAge > maxAge) {
        return {
          Error: {
            error: `Token exceeds maximum age: token is ${tokenAge}s old, maximum allowed is ${maxAge}s`,
            code: "TOO_OLD",
          },
        };
      }
    }

    const signature = base64url.default.toBuffer(encodedSignature);

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const publicKey = new Uint8Array(Buffer.from(payload.publicKey, "hex"));

    const isValid = SR25519Algorithm.verify(signingInput, signature, publicKey);

    if (!isValid) {
      return {
        Error: { error: "Invalid JWT signature", code: "INVALID_SIGNATURE" },
      };
    }

    return {
      Success: {
        header,
        payload,
        signature,
      },
    };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return {
      Error: {
        error: `JWT verification failed: ${error instanceof Error ? error.message : String(error)}`,
        code: "INVALID_FORMAT",
      },
    };
  }
}
