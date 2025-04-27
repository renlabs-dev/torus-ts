import { CID } from "multiformats/cid";
import { z } from "zod";
// import { assert_error } from "./";
import type { OldResult } from "./typing";
import { trySync } from "./try-catch";

export { CID } from "multiformats/cid";

export const URL_SCHEMA = z.string().trim().url();

export const cidToIpfsUri = (cid: CID): string => `ipfs://${cid.toString()}`;

const IPFS_URI_REGEX = /^ipfs:\/\/(\w+)$/;

export const CID_SCHEMA = z.string().transform((cid, ctx) => {
  const [parseError, cidResult] = trySync(() => CID.parse(cid));

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

    const [cidError, cid] = trySync(() => CID.parse(rest));

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
  const [directCidError, cid] = trySync(() => CID.parse(uri));

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
