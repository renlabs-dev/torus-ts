import { hexToU8a } from "@polkadot/util";
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";

import type { SS58Address } from "./address";

/**
 * Converts an Ethereum H160 address to a Substrate SS58 address public key.
 * @param ethAddress - The H160 Ethereum address as a hex string.
 * @return The bytes array containing the Substrate public key.
 */
export function convertH160ToSS58(ethAddress: string, ss58_format = 42) {
  const prefix = "evm:";
  const prefixBytes = new TextEncoder().encode(prefix);

  const addressBytes = hexToU8a(ensurePrefix(prefix, ethAddress));

  // Concatenate prefix and Ethereum address
  const combined = new Uint8Array(prefixBytes.length + addressBytes.length);
  combined.set(prefixBytes);
  combined.set(addressBytes, prefixBytes.length);

  // Hash the combined data (the public key)
  const hash = blake2AsU8a(combined);

  // Convert the hash to SS58 format
  const ss58Address = encodeAddress(hash, ss58_format);
  return ss58Address as SS58Address;
}

const ensurePrefix = (prefix: string, txt: string) =>
  txt.startsWith(prefix) ? txt : `${prefix}${txt}`;
