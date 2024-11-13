import { z } from "zod";

export const AUTH_REQ_SCHEMA = z.object({
  statement: z.string(), // "Sign in with Polkadot extension to authenticate your session at ${uri}"
  uri: z.string(), // origin or "<unknown>"
  nonce: z.string(), // hex random number
  created: z.string().datetime(), // ISO date string
});

export type AuthReq = z.infer<typeof AUTH_REQ_SCHEMA>;

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function createAuthReqData(uri: string): AuthReq {
  return {
    statement: `Sign in with Polkadot extension to authenticate your session at ${uri}`,
    uri,
    nonce: generateNonce(),
    created: new Date().toISOString(),
  };
}
