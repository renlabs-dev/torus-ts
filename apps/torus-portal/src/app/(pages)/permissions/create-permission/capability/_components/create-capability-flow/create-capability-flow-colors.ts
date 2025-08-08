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
    bg: "bg-blue-500",
    selected: "bg-blue-500/10 border-blue-500 text-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    selected: "bg-emerald-500/10 border-emerald-500 text-emerald-500",
  },
  purple: {
    bg: "bg-purple-500",
    selected: "bg-purple-500/10 border-purple-500 text-purple-500",
  },
  amber: {
    bg: "bg-amber-500",
    selected: "bg-amber-500/10 border-amber-500 text-amber-500",
  },
  cyan: {
    bg: "bg-cyan-500",
    selected: "bg-cyan-500/10 border-cyan-500 text-cyan-500",
  },
  indigo: {
    bg: "bg-indigo-500",
    selected: "bg-indigo-500/10 border-indigo-500 text-indigo-500",
  },
  orange: {
    bg: "bg-orange-500",
    selected: "bg-orange-500/10 border-orange-500 text-orange-500",
  },
  teal: {
    bg: "bg-teal-500",
    selected: "bg-teal-500/10 border-teal-500 text-teal-500",
  },
  pink: {
    bg: "bg-pink-500",
    selected: "bg-pink-500/10 border-pink-500 text-pink-500",
  },
  lime: {
    bg: "bg-lime-500",
    selected: "bg-lime-500/10 border-lime-500 text-lime-500",
  },
  rose: {
    bg: "bg-rose-500",
    selected: "bg-rose-500/10 border-rose-500 text-rose-500",
  },
  green: {
    bg: "bg-green-500",
    selected: "bg-green-500/10 border-green-500 text-green-500",
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
