import * as jwt from "jsonwebtoken";
import { z } from "zod";

import { SS58_SCHEMA } from "@torus-network/sdk/types";
import { trySync } from "@torus-network/torus-utils/try-catch";

export const SESSION_DATA_SCHEMA = z.object({
  userKey: SS58_SCHEMA,
  uri: z.string(),
});

export type SessionData = z.infer<typeof SESSION_DATA_SCHEMA>;

const JWT_OPTIONS: jwt.SignOptions = {
  algorithm: "HS256",
  expiresIn: "6h",
  // issuer: "torus-ts",
};

export const createSessionToken = (
  tokenData: SessionData,
  jwtSecret: string,
) => {
  const [error, token] = trySync(() =>
    jwt.sign(tokenData, jwtSecret, JWT_OPTIONS),
  );
  if (error !== undefined) {
    console.error("Failed to create session token:", error.message);
    throw error;
  }
  return token;
};

export const decodeSessionToken = (
  token: string,
  jwtSecret: string,
): SessionData | undefined => {
  const [verifyError, verifyResult] = trySync(() =>
    jwt.verify(token, jwtSecret, JWT_OPTIONS),
  );
  if (verifyError !== undefined) {
    console.error("Failed to verify token:", verifyError.message);
    return;
  }

  const [parseError, parseResult] = trySync(() =>
    SESSION_DATA_SCHEMA.parse(verifyResult),
  );
  if (parseError !== undefined) {
    console.error("Failed to parse token payload:", parseError.message);
    return;
  }

  return parseResult;
};
