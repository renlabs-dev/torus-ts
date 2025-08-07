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
type ColorName = (typeof colors)[number];

const PERMISSION_COLORS = colors.reduce(
  (acc, color) => ({
    ...acc,
    [color]: {
      bg: `bg-${color}-500`,
      selected: `bg-${color}-500/10 border-${color}-500 text-${color}-500`,
    },
  }),
  {} as Record<ColorName, { bg: string; selected: string }>,
);

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
