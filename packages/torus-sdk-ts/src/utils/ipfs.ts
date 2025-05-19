import { z } from "zod";
import type { OldResult } from "./typing";
import { trySync } from "./try-catch";

// Define a custom CID type that doesn't depend on multiformats/cid
export type CID = {
  toString: () => string;
  version: number;
};

export const URL_SCHEMA = z.string().trim().url();

export const cidToIpfsUri = (cid: CID): string => `ipfs://${cid.toString()}`;

const IPFS_URI_REGEX = /^ipfs:\/\/(\w+)$/;

// Basic CID validation - more rigorous validation could be added if needed
export const validateCidString = (cidStr: string): boolean => {
  // Basic validation pattern for CIDv0 and CIDv1
  // CIDv0 is base58btc encoded and starts with 'Qm'
  // CIDv1 can have various multibase prefixes (base32, base58btc, etc.)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1Regex = /^[a-z2-7]{59}$/i;

  return cidv0Regex.test(cidStr) || cidv1Regex.test(cidStr);
};

// Custom CID parser that doesn't depend on multiformats/cid
export const parseCID = (cidStr: string): CID => {
  if (!validateCidString(cidStr)) {
    throw new Error(`Invalid CID format: ${cidStr}`);
  }

  // Determine version based on the format
  const version = cidStr.startsWith('Qm') ? 0 : 1;

  return {
    toString: () => cidStr,
    version
  };
};

export const CID_SCHEMA = z.string().transform((cid, ctx) => {
  const [parseError, cidResult] = trySync(() => parseCID(cid));

  if (parseError !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid CID '${cid}', ${parseError.message}`,
    });
    return z.NEVER;
  }

  return cidResult;
});

export const IPFS_URI_SCHEMA = z
  .string()
  .url()
  .transform((uri, ctx) => {
    const match = IPFS_URI_REGEX.exec(uri);
    const cidTxt = match?.[1];
    if (!cidTxt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid IPFS URI '${uri}', does not match format 'ipfs://\\d+'`,
      });
      return z.NEVER;
    }
    return cidTxt;
  })
  .pipe(CID_SCHEMA);

export const isIpfsUri = (uri: string): boolean =>
  IPFS_URI_SCHEMA.safeParse(uri).success;

export function buildIpfsGatewayUrl(cid: CID): string {
  const cidStr = cid.toString();
  return `https://ipfs.io/ipfs/${cidStr}`;
}

const handleCleanPrefix = (uri: string, prefix: string): string => {
  while (uri.startsWith(prefix)) {
    uri = uri.slice(prefix.length);
  }
  return uri;
};

export interface CustomDataError {
  message: string;
}

/**
 * @deprecated Use IPFS_URI_SCHEMA instead.
 */
export function parseIpfsUri(uri: string): OldResult<CID, CustomDataError> {
  const ipfsPrefix = "ipfs://";

  // First try validating as URL
  const [validateError, validated] = trySync(() => URL_SCHEMA.safeParse(uri));

  if (validateError !== undefined) {
    return {
      Err: {
        message: `Unable to parse IPFS URI '${uri}' as URL: ${validateError.message}`,
      },
    };
  }

  // If URL validation succeeded
  if (validated.success) {
    const [prefixError, rest] = trySync(() =>
      handleCleanPrefix(uri, ipfsPrefix),
    );

    if (prefixError !== undefined) {
      return {
        Err: {
          message: `Unable to process IPFS prefix: ${prefixError.message}`,
        },
      };
    }

    const [cidError, cid] = trySync(() => parseCID(rest));

    if (cidError !== undefined) {
      return {
        Err: {
          message: `Unable to parse IPFS URI '${uri}' with prefix: ${cidError.message}`,
        },
      };
    }

    return { Ok: cid };
  }

  // Try parsing as direct CID if URL validation failed
  const [directCidError, cid] = trySync(() => parseCID(uri));

  if (directCidError !== undefined) {
    return {
      Err: {
        message: `Unable to parse IPFS URI '${uri}' as direct CID: ${directCidError.message}`,
      },
    };
  }

  return { Ok: cid };
}

// == Pinata ==

export const PINATA_PIN_FILE_RESULT = z.object({
  IpfsHash: CID_SCHEMA,
});

export const PIN_FILE_RESULT = z.object({
  cid: CID_SCHEMA,
});