/**
 * Address formatting utilities for Torus Network.
 */

/**
 * Returns a shortened version of the given address.
 *
 * Useful for displaying addresses in UI where space is limited.
 *
 * @param address - The address to be shortened
 * @param size - The number of characters to keep from the start and end of the address. Default is 8.
 * @returns The shortened address in format "start…end"
 *
 * @example
 * ```ts
 * smallAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
 * // Returns: "5GrwvaEF…NoHGKutQY"
 *
 * smallAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", 4)
 * // Returns: "5Grw…utQY"
 * ```
 */
export function smallAddress(address: string, size?: number): string {
  return `${address.slice(0, size ?? 8)}…${address.slice(size ? size * -1 : -8)}`;
}

/**
 * Returns a shortened wallet name with ellipsis if it exceeds the size limit.
 *
 * Unlike smallAddress, this only truncates from the end, not both sides.
 * Useful for displaying wallet names that might be custom labels.
 *
 * @param address - The wallet name or address to be shortened
 * @param size - The maximum number of characters to display. Default is 8.
 * @returns The shortened name with ellipsis if truncated, or original if within size
 *
 * @example
 * ```ts
 * smallWalletName("MyPersonalWallet", 8)
 * // Returns: "MyPerson…"
 *
 * smallWalletName("Short", 8)
 * // Returns: "Short"
 * ```
 */
export function smallWalletName(address: string, size?: number): string {
  const effectiveSize = size ?? 8;
  if (address.length > effectiveSize) {
    return `${address.slice(0, effectiveSize)}…`;
  }
  return address;
}
