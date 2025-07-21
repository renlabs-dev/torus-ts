/**
 * Torus token constants
 */

/**
 * Number of decimal places for TORUS token.
 * 1 TORUS = 10^18 Rems (smallest unit)
 */
export const DECIMALS = 18;

/**
 * BigInt representation of decimal places.
 * Used for BigInt arithmetic operations.
 */
export const DECIMALS_BIG = BigInt(DECIMALS);

/**
 * Multiplier for converting between TORUS and Rems.
 * Equals 10^18 or 1,000,000,000,000,000,000.
 *
 * @example
 * ```ts
 * // Convert 1 TORUS to Rems
 * const rems = 1n * DECIMALS_MULTIPLIER; // 1000000000000000000n
 * ```
 */
export const DECIMALS_MULTIPLIER = 10n ** DECIMALS_BIG;
