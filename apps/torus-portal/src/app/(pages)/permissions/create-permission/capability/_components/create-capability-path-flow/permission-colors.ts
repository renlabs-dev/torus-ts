import type { PermissionId } from "@torus-network/sdk/chain";

/**
 * Predefined color palette for permissions
 * Each color has both light and dark theme variants
 */
export const PERMISSION_COLORS = [
  {
    name: "blue",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    text: "text-blue-500",
    button: "bg-blue-500",
    buttonText: "text-white",
    hex: "#3b82f6",
  },
  {
    name: "emerald",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    text: "text-emerald-500",
    button: "bg-emerald-500",
    buttonText: "text-white",
    hex: "#10b981",
  },
  {
    name: "purple",
    bg: "bg-purple-500/10",
    border: "border-purple-500",
    text: "text-purple-500",
    button: "bg-purple-500",
    buttonText: "text-white",
    hex: "#8b5cf6",
  },
  {
    name: "amber",
    bg: "bg-amber-500/10",
    border: "border-amber-500",
    text: "text-amber-500",
    button: "bg-amber-500",
    buttonText: "text-white",
    hex: "#f59e0b",
  },
  {
    name: "rose",
    bg: "bg-rose-500/10",
    border: "border-rose-500",
    text: "text-rose-500",
    button: "bg-rose-500",
    buttonText: "text-white",
    hex: "#f43f5e",
  },
  {
    name: "cyan",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500",
    text: "text-cyan-500",
    button: "bg-cyan-500",
    buttonText: "text-white",
    hex: "#06b6d4",
  },
  {
    name: "indigo",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500",
    text: "text-indigo-500",
    button: "bg-indigo-500",
    buttonText: "text-white",
    hex: "#6366f1",
  },
  {
    name: "orange",
    bg: "bg-orange-500/10",
    border: "border-orange-500",
    text: "text-orange-500",
    button: "bg-orange-500",
    buttonText: "text-white",
    hex: "#f97316",
  },
  {
    name: "teal",
    bg: "bg-teal-500/10",
    border: "border-teal-500",
    text: "text-teal-500",
    button: "bg-teal-500",
    buttonText: "text-white",
    hex: "#14b8a6",
  },
  {
    name: "pink",
    bg: "bg-pink-500/10",
    border: "border-pink-500",
    text: "text-pink-500",
    button: "bg-pink-500",
    buttonText: "text-white",
    hex: "#ec4899",
  },
  {
    name: "lime",
    bg: "bg-lime-500/10",
    border: "border-lime-500",
    text: "text-lime-500",
    button: "bg-lime-500",
    buttonText: "text-white",
    hex: "#84cc16",
  },
  {
    name: "slate",
    bg: "bg-slate-500/10",
    border: "border-slate-500",
    text: "text-slate-500",
    button: "bg-slate-500",
    buttonText: "text-white",
    hex: "#64748b",
  },
] as const;

/**
 * Special color for self-owned permissions (infinite delegation)
 */
export const SELF_PERMISSION_COLOR = {
  name: "self",
  bg: "bg-green-500/10",
  border: "border-green-500",
  text: "text-green-500",
  button: "bg-green-500",
  buttonText: "text-white",
  hex: "#22c55e",
} as const;

export type PermissionColor =
  | (typeof PERMISSION_COLORS)[number]
  | typeof SELF_PERMISSION_COLOR;

/**
 * Permission color manager to assign consistent colors to permissions
 */
export class PermissionColorManager {
  private permissionColorMap = new Map<
    PermissionId | "self",
    PermissionColor
  >();
  private usedColorIndices = new Set<number>();

  /**
   * Get or assign a color for a permission
   */
  getColorForPermission(permissionId: PermissionId | "self"): PermissionColor {
    // Self-owned permissions always use the special green color
    if (permissionId === "self") {
      this.permissionColorMap.set(permissionId, SELF_PERMISSION_COLOR);
      return SELF_PERMISSION_COLOR;
    }

    // Check if we already assigned a color to this permission
    const existingColor = this.permissionColorMap.get(permissionId);
    if (existingColor) {
      return existingColor;
    }

    // Find the next available color
    let colorIndex = 0;
    while (
      this.usedColorIndices.has(colorIndex) &&
      colorIndex < PERMISSION_COLORS.length
    ) {
      colorIndex++;
    }

    // If we've used all colors, start cycling (shouldn't happen often)
    if (colorIndex >= PERMISSION_COLORS.length) {
      colorIndex = Math.floor(Math.random() * PERMISSION_COLORS.length);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const selectedColor = PERMISSION_COLORS[colorIndex]!;
    this.usedColorIndices.add(colorIndex);
    this.permissionColorMap.set(permissionId, selectedColor);

    return selectedColor;
  }

  /**
   * Get all assigned permission colors
   */
  getAllAssignedColors(): Map<PermissionId | "self", PermissionColor> {
    return new Map(this.permissionColorMap);
  }

  /**
   * Clear all color assignments (useful when switching wallets)
   */
  clear(): void {
    this.permissionColorMap.clear();
    this.usedColorIndices.clear();
  }

  /**
   * Get display text for permission ID
   */
  getPermissionDisplayText(permissionId: PermissionId | "self"): string {
    if (permissionId === "self") {
      return "SELF";
    }
    return `0x${permissionId.slice(2, 10).toUpperCase()}`;
  }
}
