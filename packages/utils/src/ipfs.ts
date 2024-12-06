import { CID } from "multiformats/cid";

import type { CustomDataError, Result } from "./typing";
import { URL_SCHEMA } from ".";

export function buildIpfsGatewayUrl(cid: CID): string {
  const cidStr = cid.toString();
  return `https://ipfs.io/ipfs/${cidStr}`;
}

export function parseIpfsUri(uri: string): Result<CID, CustomDataError> {
  const validated = URL_SCHEMA.safeParse(uri);
  if (!validated.success) {
    const message = `Invalid IPFS URI '${uri}'`;
    return { Err: { message } };
  }
  const ipfsPrefix = "ipfs://";
  const rest = uri.startsWith(ipfsPrefix) ? uri.slice(ipfsPrefix.length) : uri;
  try {
    const cid = CID.parse(rest);
    return { Ok: cid };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    const message = `Unable to parse IPFS URI '${uri}'`;
    return { Err: { message } };
  }
}
