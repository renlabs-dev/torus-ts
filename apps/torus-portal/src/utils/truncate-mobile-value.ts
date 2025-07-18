/**
 * Truncates a string value on mobile devices by keeping the end portion and adding ellipsis at the start.
 *
 * @param value - The string value to truncate
 * @param isMobile - Whether the current device is mobile
 * @param maxLength - Maximum length before truncation (default: 25)
 * @param keepLength - Number of characters to keep from the end (default: 25)
 * @example
 * ```ts
 * // On mobile with long value
 * truncateMobileValue("agent.very.long.namespace.path", true);
 * // Returns: "...very.long.namespace.path"
 *
 * // On desktop or short value
 * truncateMobileValue("agent.short", false);
 * // Returns: "agent.short"
 * ```
 */
export function truncateMobileValue(
  value: string | undefined,
  isMobile: boolean,
  maxLength = 25,
  keepLength = 25,
): string {
  if (!isMobile || !value) return value ?? "";
  if (value.length > maxLength) {
    return `...${value.substring(value.length - keepLength)}`;
  }
  return value;
}
