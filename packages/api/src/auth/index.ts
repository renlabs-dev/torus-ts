import { SS58_SCHEMA } from "@torus-network/sdk";
import * as jwt from "jsonwebtoken";
import { z } from "zod";

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
  const token = jwt.sign(tokenData, jwtSecret, JWT_OPTIONS);
  return token;
};

export const decodeSessionToken = (
  token: string,
  jwtSecret: string,
): SessionData => {
  const payload = jwt.verify(token, jwtSecret, JWT_OPTIONS);
  const parsed = SESSION_DATA_SCHEMA.parse(payload);
  return parsed;
};
