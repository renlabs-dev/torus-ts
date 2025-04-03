import { CID } from "multiformats/cid";
import { z } from "zod";
import { assert_error } from "./";
import type { OldResult } from "./typing";

export { CID } from "multiformats/cid";

export const URL_SCHEMA = z.string().trim().url();

export const cidToIpfsUri = (cid: CID): string => `ipfs://${cid.toString()}`;

const IPFS_URI_REGEX = /^ipfs:\/\/(\w+)$/;

export const CID_SCHEMA = z.string().transform((cid, ctx) => {
  let cidResult: CID;
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

// == Pinata ==

export const PINATA_PIN_FILE_RESULT = z.object({
  IpfsHash: CID_SCHEMA,
});

export const PIN_FILE_RESULT = z.object({
  cid: CID_SCHEMA,
});
