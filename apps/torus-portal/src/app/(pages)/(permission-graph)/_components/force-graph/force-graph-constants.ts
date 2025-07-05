export const GRAPH_CONSTANTS = {
  // Animation constants
  LINK_DISTANCE: 100,
  CHARGE_STRENGTH: -100,

  // Node constants
  ALLOCATOR_NODE_SIZE: 200,
  ROOT_NODE_SIZE: 50,
  PERMISSION_NODE_SIZE: 15,
  TARGET_NODE_SIZE: 25,
  MIN_NODE_SIZE: 5,
  SIGNAL_NODE_SIZE: 0.5,

  // Link constants
  HIGHLIGHT_LINK_WIDTH_MULTIPLIER: 1.5,
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
    ROOT_NODE: "#93c5fd", // blue-300 (whitelisted agents)
    PERMISSION_NODE: "#f59e0b", // amber-500 (permission representations)
    TARGET_NODE: "#38bdf8", // sky-500 (permission targets)
    ALLOCATED_AGENT: "#93c5fd", // blue-300
    GRANTOR: "#7dd3fc", // sky-300
    GRANTEE: "#38bdf8", // sky-500
    BOTH: "#34d399", // soft purple
    DEFAULT: "#64B5F6", // soft blue
    SIGNAL: "#8b5cf6", // purple
    PERMISSION_LINK: "#cbd5e1", // slate-300
    ALLOCATION_LINK: "#FFFFFF", // white
    PERMISSION_TO_TARGET_LINK: "#f59e0b", // amber-500
    SIGNAL_LINK: "#8b5cf6", // purple
  },

  // Link properties
  PERMISSION_LINK: {
    particleWidth: 3,
    width: 1,
  },

  ALLOCATION_LINK: {
    particleWidth: 3,
    width: 1,
  },

  SIGNAL_LINK: {
    width: 1.2,
    particles: 0,
  },
} as const;
