/**
 * Shared constants for the Torus Wallet application.
 */

/**
 * Minimum stake amount safeguard - 0.5 TORUS in smallest units.
 * Used as a fallback when the network minimum stake value is unavailable.
 */
export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;

/**
 * Minimum existential balance - 0.1 TORUS in smallest units.
 * The minimum balance required to keep an account alive on the network.
 */
export const MIN_EXISTENTIAL_BALANCE = 100000000000000000n;