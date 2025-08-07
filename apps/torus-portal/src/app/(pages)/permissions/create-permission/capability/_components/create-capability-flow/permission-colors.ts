import type { PermissionId } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/torus";

/**
 * Available color names for permissions
 */
export const PERMISSION_COLOR_NAMES = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "orange",
  "teal",
  "pink",
  "lime",
  "slate",
] as const;

export type PermissionColorName =
  | (typeof PERMISSION_COLOR_NAMES)[number]
  | "green";

/**
 * Module-level state for permission color assignment
 */
const permissionColorMap = new Map<
  PermissionId | "self",
  PermissionColorName
>();
const usedColorIndices = new Set<number>();

/**
 * Get or assign a color name for a permission
 */
export function getPermissionColor(
  permissionId: PermissionId | "self",
): PermissionColorName {
  // Self-owned permissions always use green
  if (permissionId === "self") {
    permissionColorMap.set(permissionId, "green");
    return "green";
  }

  // Check if we already assigned a color to this permission
  const existingColor = permissionColorMap.get(permissionId);
  if (existingColor) {
    return existingColor;
  }

  // Find the next available color
  let colorIndex = 0;
  while (
    usedColorIndices.has(colorIndex) &&
    colorIndex < PERMISSION_COLOR_NAMES.length
  ) {
    colorIndex++;
  }

  // If we've used all colors, start cycling (shouldn't happen often)
  if (colorIndex >= PERMISSION_COLOR_NAMES.length) {
    colorIndex = Math.floor(Math.random() * PERMISSION_COLOR_NAMES.length);
  }

  const colorName = PERMISSION_COLOR_NAMES[colorIndex] ?? "slate";
  usedColorIndices.add(colorIndex);
  permissionColorMap.set(permissionId, colorName);

  return colorName;
}

/**
 * Get display text for permission ID
 */
export function getPermissionDisplayText(
  permissionId: PermissionId | "self",
): string {
  if (permissionId === "self") {
    return "Your Paths";
  }
  return `0x${smallAddress(permissionId)}`;
}
