export const GRAPH_CONSTANTS = {
  // Animation constants
  LINK_DISTANCE: 50,

  // Node constants
  NODE_RESOLUTION: 24,
  NODE_OPACITY: 1,
  ALLOCATOR_NODE_SIZE: 200,
  MIN_NODE_SIZE: 5,

  // Link constants
  LINK_OPACITY: 0.5,
  HIGHLIGHT_LINK_WIDTH_MULTIPLIER: 2,
  HIGHLIGHT_PARTICLES_INCREASE: 2,
  MIN_PARTICLES: 2,

  // Highlight effects
  HOVER_NODE_LIGHTEN_AMOUNT: 0.4,
  NEIGHBOR_NODE_LIGHTEN_AMOUNT: 0.15,

  // Data processing
  SCALE_FACTOR: 5,
  WEIGHT_POWER: 1.2,
  INDEFINITE_PERMISSION_BLOCKS: 999999999,

  // Colors
  COLORS: {
    USER_NODE: "#dc2626", // red-600
    ALLOCATOR: "#ffffff", // white
    ALLOCATED_AGENT: "#FFD700", // gold
    GRANTOR: "#4FC3F7", // light cyan
    GRANTEE: "#81C784", // soft green
    BOTH: "#9575CD", // soft purple
    DEFAULT: "#64B5F6", // soft blue
    PERMISSION_LINK: "#B39DDB", // soft lavender
    ALLOCATION_LINK: "#90CAF9", // soft sky blue
  },

  // Link properties
  PERMISSION_LINK: {
    directionalArrowLength: 3.5,
    directionalArrowRelPos: 1,
    curvature: 0.3,
    width: 1.5,
    opacity: 0.6,
  },

  ALLOCATION_LINK: {
    particleWidth: 2.5,
    curvature: 0,
    width: 2.5,
    opacity: 0.8,
  },
} as const;
