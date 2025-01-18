import { CID } from "multiformats/cid";
import { z } from "zod";

import { assert_error } from "./";
import type { Result } from "./typing";

export const URL_SCHEMA = z.string().trim().url();

export interface CustomDataError {
  message: string;
}

const IPFS_URI_REGEX = /^ipfs:\/\/(\w+)$/;

export const CID_SCHEMA = z.string().transform((cid, ctx) => {
  let cidResult;
  try {
    cidResult = CID.parse(cid);
  } catch (err) {
    assert_error(err);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid CID '${cid}', ${err}`,
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

/**
 * @deprecated Use IPFS_URI_SCHEMA instead.
 */
export function parseIpfsUri(uri: string): Result<CID, CustomDataError> {
  const ipfsPrefix = "ipfs://";
  const validated = URL_SCHEMA.safeParse(uri);
  try {
    if (validated.success) {
      const rest = handleCleanPrefix(uri, ipfsPrefix);
      const cid = CID.parse(rest);
      return { Ok: cid };
    }

    const cid = CID.parse(uri);
    return { Ok: cid };
  } catch (err) {
    assert_error(err);
    const message = `Unable to parse IPFS URI '${uri}', ${err}`;
    return { Err: { message } };
  }
}
