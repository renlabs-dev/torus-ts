import { CID } from "multiformats/cid";

import type { Result } from "./typing";
import { URL_SCHEMA } from ".";

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
      const rest = handleCleanPrefix(uri, ipfsPrefix)
      const cid = CID.parse(rest);
      return { Ok: cid };
    }

  const cid = CID.parse(uri);
  return { Ok: cid };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    const message = `Unable to parse IPFS URI '${uri}'`;
    return { Err: { message } };
  }
}
