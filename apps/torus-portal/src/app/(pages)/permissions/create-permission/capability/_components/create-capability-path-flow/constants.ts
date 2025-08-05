// React Flow options
export const REACT_FLOW_PRO_OPTIONS = {
  hideAttribution: true,
};

// Layout configuration
export const DEFAULT_LAYOUT_OPTIONS = {
  algorithm: "d3-hierarchy" as const,
  direction: "LR" as const,
  spacing: [40, 60] as [number, number],
};

// Color constants
export const EDGE_COLORS = {
  selected: "#ffffff",
  default: "#64748b",
} as const;

export const EDGE_WIDTHS = {
  selected: 2,
  default: 1,
} as const;

// Node styling
export const NODE_STYLES = {
  inaccessible:
    "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10",
  selected: "border-2",
  default: "bg-muted border-border",
} as const;

// Permission button styles
export const PERMISSION_BUTTON_STYLES = {
  blocked: "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50",
  selected: "text-white ring-2 ring-offset-1 ring-blue-500",
  default: "text-white hover:opacity-80 transition-opacity",
} as const;

// Opacity values
export const OPACITY = {
  backgroundSelected: "10", // 10% opacity for selected node background
} as const;
