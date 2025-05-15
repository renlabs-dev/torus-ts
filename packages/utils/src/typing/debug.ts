/**
 * Forces the TypeScript compiler to emit a message containing the inferred type
 * of the input. This is a utility function used for debugging type inference
 * issues during development.
 *
 * The function doesn't modify the input value but leverages TypeScript's type
 * checking to show the inferred type in editor tooltips or compiler messages.
 *
 * @template T - The type parameter constrained to 'never' to maximize type
 * inference visibility
 * @param {T} x - The value whose type should be observed
 * @returns {T} - Returns the input value unchanged
 */
export const observeType = <T extends never>(x: T): T => x;
