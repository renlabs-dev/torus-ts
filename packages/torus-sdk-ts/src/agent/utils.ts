import { sr25519Verify } from "@polkadot/util-crypto";
import { type SS58Address, SS58_SCHEMA } from "@torus-network/sdk";
import base64url from "base64url";
import * as jwt from "jsonwebtoken";
import { z } from "zod";

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
  userPublicKey: z.string(),
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

export const decodeAuthToken = (token: string): TokenData | null => {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new Error("Invalid JWT token");
    }

    const message = new TextEncoder().encode(
      `${encodedHeader}.${encodedPayload}`,
    );
    const signature = base64url.default.toBuffer(encodedSignature);

    const decodedPayload = jwt.decode(token);

    if (!decodedPayload) {
      throw new Error("Invalid JWT token");
    }

    const tokenDataParsed = TokenDataSchema.safeParse(decodedPayload);

    if (!tokenDataParsed.success) {
      throw new Error("Invalid JWT token");
    }

    const tokenData = tokenDataParsed.data;

    const publicKey = new Uint8Array(
      Buffer.from(tokenData.userPublicKey, "hex"),
    );

    const isValid = sr25519Verify(message, signature, publicKey);

    if (!isValid) {
      return null;
    }

    return tokenData;
  } catch (error) {
    console.error("error", error);

    return null;
  }
};

export const getCurrentProtocolVersion = () => CURRENT_PROTOCOL_VERSION;
