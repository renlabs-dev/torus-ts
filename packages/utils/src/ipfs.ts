import { CID } from "multiformats/cid";
import { z } from "zod";

import type { Result } from "./typing";

export const URL_SCHEMA = z.string().trim().url();

export interface CustomDataError {
  message: string;
}

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
  } catch (e) {
    const message = `Unable to parse IPFS URI '${uri}'`;
    return { Err: { message } };
  }
}
