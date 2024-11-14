import type { Tagged } from "rustie";
import { decodeAddress } from "@polkadot/util-crypto";
import { z } from "zod";

export type SS58Address = Tagged<"SS58Address", string>;

export function checkSS58(value: string | SS58Address): SS58Address {
  try {
    decodeAddress(value);
  } catch (err) {
    throw new Error(`Invalid SS58 address: ${value}`, { cause: err });
  }
  return value as SS58Address;
}

export function isSS58(value: string | null | undefined): value is SS58Address {
  try {
    decodeAddress(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return false;
  }
  return true;
}

export const ADDRESS_SCHEMA = z
  .string()
  .refine<SS58Address>(isSS58, "Invalid SS58 address");
