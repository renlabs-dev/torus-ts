import { hexToU8a, stringToU8a } from "@polkadot/util";
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";

import type { SS58Address } from "./address";
import { assert } from "tsafe";

const ADDRESS_FORMAT = 42;

/**
 * Converts an Ethereum H160 address to a Substrate SS58 address public key.
 * @param ethAddress - The H160 Ethereum address as a hex string.
 * @return The bytes array containing the Substrate public key.
 */
export function convertH160ToSS58(
  ethAddress: string,
  ss58_format = ADDRESS_FORMAT,
) {
  assert(ethAddress.startsWith("0x"), "EVM address must start with 0x");

  const prefixBytes = stringToU8a("evm:");
  const addressBytes = hexToU8a(ethAddress);

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
