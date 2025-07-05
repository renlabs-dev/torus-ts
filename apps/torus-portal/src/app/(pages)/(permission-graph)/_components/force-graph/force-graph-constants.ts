export const graphConstants = {
  // Physics and animation constants
  physics: {
    linkDistance: 100,
    chargeStrength: -100,
    centerForceStrength: 0.1,
  },

  // Data processing and scaling
  dataProcessing: {
    scaleFactor: 2,
    weightPower: 1.2,
    indefinitePermissionBlocks: 999999999,
  },

  // Highlight and interaction effects
  highlightEffects: {
    hoverNodeLightenAmount: 0.8,
    neighborNodeLightenAmount: 0.4,
    linkWidthMultiplier: 1.5,
    particlesIncrease: 2,
  },

  // Particle animation settings
  particleAnimation: {
    speedMin: 0.002,
    speedMax: 0.006,
    resolution: 4,
    minParticles: 1,
    defaultSpeed: 0.008,
  },

  // Node configuration
  nodeConfig: {
    nodeColors: {
      allocator: "#ffffff", // white
      rootNode: "#93c5fd", // blue-300 (whitelisted agents)
      permissionNode: "#f59e0b", // amber-500 (permission representations)
      targetNode: "#38bdf8", // sky-500 (permission targets)
      userNode: "#fde68a", // amber-300
      signalNode: "#8b5cf6", // purple
      allocatedAgent: "#93c5fd", // blue-300
      grantor: "#7dd3fc", // sky-300
      grantee: "#38bdf8", // sky-500
      both: "#34d399", // emerald-400
      default: "#64B5F6", // soft blue
    },
    nodeSizes: {
      allocator: 200,
      rootNode: 50,
      permissionNode: 15,
      targetNode: 25,
      userNode: 25,
      signalNode: 0.5,
      minNode: 5,
    },
    nodeGeometry: {
      allocator: {
        type: "torusKnot",
        radius: 10,
        tubeRadius: 3,
        tubularSegments: 300,
        radialSegments: 7,
        p: 4,
        q: 14,
      },
      rootNode: {
        type: "sphere",
        radius: 9,
        widthSegments: 18,
        heightSegments: 18,
      },
      permissionNode: {
        type: "icosahedron",
        radius: 5,
        detail: 0,
      },
      targetNode: {
        type: "sphere",
        radius: 9,
        widthSegments: 18,
        heightSegments: 18,
      },
      userNode: {
        type: "sphere",
        radius: 9,
        widthSegments: 18,
        heightSegments: 18,
      },
      signalNode: {
        type: "tetrahedron",
        radius: 6,
        detail: 0,
      },
    },
    rendering: {
      resolution: 24,
      opacity: 1,
    },
  },

  // Link configuration
  linkConfig: {
    linkColors: {
      permissionLink: "#cbd5e1", // slate-300
      allocationLink: "#FFFFFF", // white
      signalLink: "#8b5cf6", // purple
      permissionToTargetLink: "#f59e0b", // amber-500
    },
    linkWidths: {
      permissionLink: 1,
      allocationLink: 1,
      signalLink: 1,
    },
    particleConfig: {
      permissionLink: {
        particleWidth: 3,
        particles: 1,
        speed: 0.008,
      },
      allocationLink: {
        particleWidth: 3,
        particles: 1,
        speed: 0.008,
      },
      signalLink: {
        particleWidth: 3,
        particles: 0,
        speed: 0.008,
      },
    },
  },
};
