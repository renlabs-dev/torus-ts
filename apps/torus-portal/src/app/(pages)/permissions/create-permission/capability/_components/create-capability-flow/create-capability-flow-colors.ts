import type { PermissionId } from "@torus-network/sdk/chain";

const colors = [
  "blue",
  "emerald",
  "purple",
  "amber",
  "cyan",
  "indigo",
  "orange",
  "teal",
  "pink",
  "lime",
  "rose",
  "green",
] as const;

const PERMISSION_COLORS = {
  blue: {
    bg: "bg-blue-600",
    selected: "bg-blue-600/10 border-blue-600 text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-600",
    selected: "bg-emerald-600/10 border-emerald-600 text-emerald-600",
  },
  purple: {
    bg: "bg-purple-600",
    selected: "bg-purple-600/10 border-purple-600 text-purple-600",
  },
  amber: {
    bg: "bg-amber-600",
    selected: "bg-amber-600/10 border-amber-600 text-amber-600",
  },
  cyan: {
    bg: "bg-cyan-600",
    selected: "bg-cyan-600/10 border-cyan-600 text-cyan-600",
  },
  indigo: {
    bg: "bg-indigo-600",
    selected: "bg-indigo-600/10 border-indigo-600 text-indigo-600",
  },
  orange: {
    bg: "bg-orange-600",
    selected: "bg-orange-600/10 border-orange-600 text-orange-600",
  },
  teal: {
    bg: "bg-teal-600",
    selected: "bg-teal-600/10 border-teal-600 text-teal-600",
  },
  pink: {
    bg: "bg-pink-600",
    selected: "bg-pink-600/10 border-pink-600 text-pink-600",
  },
  lime: {
    bg: "bg-lime-600",
    selected: "bg-lime-600/10 border-lime-600 text-lime-600",
  },
  rose: {
    bg: "bg-rose-600",
    selected: "bg-rose-600/10 border-rose-600 text-rose-600",
  },
  green: {
    bg: "bg-green-600",
    selected: "bg-green-600/10 border-green-600 text-green-600",
  },
} as const;

const COLOR_NAMES = colors;

export function getPermissionClasses(permissionId: PermissionId | "self") {
  if (permissionId === "self") {
    return PERMISSION_COLORS.green;
  }

  let hash = 0;
  for (let i = 0; i < permissionId.length; i++) {
    const char = permissionId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const colorName = COLOR_NAMES[Math.abs(hash) % COLOR_NAMES.length]!;

  return PERMISSION_COLORS[colorName];
}
