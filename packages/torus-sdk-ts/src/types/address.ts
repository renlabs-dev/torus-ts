/**
 * SS58 address validation utilities and branded types for type-safe address
 * handling.
 *
 * This module provides type-safe SS58 address validation for the Torus Network,
 * using branded types to distinguish validated addresses from raw strings at
 * the type level. All functions use Polkadot's address decoding for validation.
 */

import { decodeAddress } from "@polkadot/util-crypto";
import type { Brand } from "@torus-network/torus-utils";
import { trySync } from "@torus-network/torus-utils/try-catch";
import { z } from "zod";

/**
 * A branded type for validated SS58 addresses.
 *
 * This type ensures that addresses have been validated through `checkSS58()` or
 * `isSS58()` before being used in the type system. This provides compile-time
 * guarantees that only validated addresses are passed to functions expecting
 * them.
 *
 * @example
 * ```ts
 * // Raw string - not guaranteed to be valid
 * const raw: string = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
 *
 * // Branded address - guaranteed to be valid
 * const address: SS58Address = checkSS58(raw);
 *
 * // TypeScript prevents using unvalidated strings where SS58Address expected
 * function processAddress(addr: SS58Address) { ... }
 * processAddress(raw);     // ❌ Type error
 * processAddress(address); // ✅ OK
 * ```
 */
export type SS58Address = Brand<"SS58Address", string>;

/**
 * Validates an SS58 address string and returns it as a branded SS58Address type.
 *
 * Throws an error if the address is invalid. Use this when you need to validate
 * an address and want the validation failure to propagate as an exception.
 * Particularly useful for cases where you know the address should be valid,
 * such as hardcoded addresses or configuration values.
 * For non-throwing validation, use `isSS58()` instead.
 *
 * @param value - The address string to validate, or an already validated SS58Address
 * @throws {Error} When the address format is invalid, with the original validation error as cause
 *
 * @example
 * ```ts
 * // Valid address - common for hardcoded addresses
 * const TREASURY = checkSS58("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
 *
 * function useAddress(addr: SS58Address) { ... }
 *
 * // Already branded addresses pass through unchanged
 * useAddress(TREASURY);
 * ```
 */
export function checkSS58(value: string | SS58Address): SS58Address {
  const [error] = trySync(() => decodeAddress(value));
  if (error !== undefined) {
    throw new Error(`Invalid SS58 address: ${value}`, { cause: error });
  }
  return value as SS58Address;
}

/**
 * Type guard that checks if a value is a valid SS58 address.
 *
 * Returns false for invalid addresses instead of throwing. Use this when you
 * need to conditionally handle valid vs invalid addresses, such as user input
 * validation or optional address processing.
 *
 * @param value - The value to check (accepts null/undefined for convenience)
 *
 * @example
 * ```ts
 * // User input validation
 * function processUserAddress(input: string | null): SS58Address | null {
 *   if (isSS58(input)) {
 *     // input is now typed as SS58Address
 *     console.log("Valid address:", input);
 *     return input; // Type is SS58Address
 *   } else {
 *     console.log("Invalid address provided");
 *     return null;
 *   }
 * }
 *
 * // Filtering valid addresses from a list
 * const addresses = ["5GrwvaEF...", "invalid", "5FHneW..."];
 * const validAddresses = addresses.filter(isSS58); // SS58Address[]
 * ```
 */
export function isSS58(value: string | null | undefined): value is SS58Address {
  const [error] = trySync(() => decodeAddress(value));
  if (error !== undefined) {
    return false;
  }
  return true;
}

/**
 * Zod schema for validating and parsing SS58 addresses.
 *
 * This schema validates string input using `isSS58()` and returns a branded
 * SS58Address type. Integrates with the substrate parsers (e.g., `sb_address`)
 * for consistent validation across the SDK.
 *
 * @example
 * ```ts
 * // Parse and validate user input
 * const result = SS58_SCHEMA.safeParse("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
 * if (result.success) {
 *   const address: SS58Address = result.data;
 * } else {
 *   console.error("Invalid address:", result.error.message);
 * }
 *
 * // Use in larger schemas
 * const UserSchema = z.object({
 *   name: z.string(),
 *   address: SS58_SCHEMA,
 * });
 * ```
 */
export const SS58_SCHEMA = z
  .string()
  .refine<SS58Address>(isSS58, "Invalid SS58 address");
