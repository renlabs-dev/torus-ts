import { blake2AsHex } from "@polkadot/util-crypto";
import canonicalize from "canonicalize";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function createHttpError(status: number, message: string): HttpError {
  return new HttpError(status, message);
}

export interface SignedErrorResponse<T> {
  error: string;
  input: T;
  receipt: {
    signature: string;
    timestamp: string;
  };
}

export function createSignedError<T>(
  status: number,
  error: string,
  input: T,
  signHash: (hash: string) => string,
): SignedErrorResponse<T> {
  const timestamp = new Date().toISOString();
  const errorData = {
    error,
    status,
    input,
    timestamp,
  };

  const errorCanonical = canonicalize(errorData);
  if (!errorCanonical) {
    throw new Error("Failed to canonicalize error data");
  }

  const errorHash = blake2AsHex(errorCanonical);
  const signature = signHash(errorHash);

  return {
    error,
    input,
    receipt: {
      signature,
      timestamp,
    },
  };
}
