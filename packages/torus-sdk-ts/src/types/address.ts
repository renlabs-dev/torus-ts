import { decodeAddress } from "@polkadot/util-crypto";
import type { Brand } from "@torus-network/torus-utils";
import { trySync } from "@torus-network/torus-utils/try-catch";
import { z } from "zod";

export type SS58Address = Brand<"SS58Address", string>;

export function checkSS58(value: string | SS58Address): SS58Address {
  const [error] = trySync(() => decodeAddress(value));
  if (error !== undefined) {
    throw new Error(`Invalid SS58 address: ${value}`, { cause: error });
  }
  return value as SS58Address;
}

export function isSS58(value: string | null | undefined): value is SS58Address {
  const [error] = trySync(() => decodeAddress(value));
  if (error !== undefined) {
    return false;
  }
  return true;
}

export const SS58_SCHEMA = z
  .string()
  .refine<SS58Address>(isSS58, "Invalid SS58 address");
