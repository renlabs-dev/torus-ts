export const GRAPH_CONSTANTS = {
  // Animation constants
  LINK_DISTANCE: 50,

  // Node constants
  ALLOCATOR_NODE_SIZE: 200,
  MIN_NODE_SIZE: 5,

  // Link constants
  HIGHLIGHT_LINK_WIDTH_MULTIPLIER: 2,
  HIGHLIGHT_PARTICLES_INCREASE: 2,
  MIN_PARTICLES: 1,

  // Particle animation constants
  PARTICLE_SPEED_MIN: 0.002,
  PARTICLE_SPEED_MAX: 0.006,
  PARTICLE_RESOLUTION: 4,

  // Highlight effects
  HOVER_NODE_LIGHTEN_AMOUNT: 0.8,
  NEIGHBOR_NODE_LIGHTEN_AMOUNT: 0.4,

  // Data processing
  SCALE_FACTOR: 2,
  WEIGHT_POWER: 1.2,
  INDEFINITE_PERMISSION_BLOCKS: 999999999,

  // Colors
  COLORS: {
    USER_NODE: "#fde68a", // amber-300
    ALLOCATOR: "#ffffff", // white
    ALLOCATED_AGENT: "#93c5fd", // blue-300
    GRANTOR: "#7dd3fc", // sky-300
    GRANTEE: "#38bdf8", // sky-500
    BOTH: "#34d399", // soft purple
    DEFAULT: "#64B5F6", // soft blue
    PERMISSION_LINK: "#cbd5e1", // slate-300
    ALLOCATION_LINK: "#FFFFFF", // white
  },

  // Link properties
  PERMISSION_LINK: {
    directionalArrowLength: 6,
    directionalArrowRelPos: 1,
    width: 1,
  },

  ALLOCATION_LINK: {
    particleWidth: 3,
    width: 1,
  },
} as const;
