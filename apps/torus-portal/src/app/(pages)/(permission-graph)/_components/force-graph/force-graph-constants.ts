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
      // Core network node
      allocator: "#ffffff", // white (stays as requested)

      // Agent/Node group (Blue family - network participants)
      rootNode: "#3b82f6", // blue-500 (whitelisted agents)
      targetNode: "#10b981", // emerald-500 (permission targets)
      userNode: "#d946ef", // sky-500 (user's agent)

      // Permission group (Orange/Yellow family - permission types)
      permissionNode: "#f97316", // orange-500 (legacy fallback)
      emissionPermissionNode: "#ffffff", // white0 (emission permissions)
      namespacePermissionNode: "#eab308", // yellow-500 (namespace permissions)

      // Special nodes
      signalNode: "#69ff5c", // violet-500 (demand signals)
      default: "#6b7280", // gray-500 (fallback)
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
        type: "sphere",
        radius: 24,
        widthSegments: 24,
        heightSegments: 24,
      },
      rootNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
      },
      permissionNode: {
        type: "icosahedron",
        radius: 12,
        detail: 0,
      },
      targetNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
      },
      userNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
      },
      signalNode: {
        type: "tetrahedron",
        radius: 8,
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
      // Source-based link colors (follow the source node color)
      allocatorLink: "#ffffff", // white (from allocator)
      rootNodeLink: "#3b82f6", // blue-500 (from whitelisted agents)
      emissionPermissionLink: "#ffffff", // white(from emission permissions)
      namespacePermissionLink: "#eab308", // yellow-500 (from namespace permissions)
      targetNodeLink: "#10b981", // emerald-500 (from target nodes)
      userNodeLink: "#0ea5e9", // sky-500 (from user nodes)

      // Special link types (exceptions)
      signalLink: "#69ff5c", // violet-500 (signals keep their own color)
      defaultLink: "#6b7280", // gray-500 (fallback)

      // Legacy colors (for backward compatibility)
      permissionLink: "#f97316", // orange-500 (fallback to emission)
      allocationLink: "#ffffff", // white (allocator links)
      permissionToTargetLink: "#f97316", // orange-500 (fallback to emission)
    },
    linkWidths: {
      permissionLink: 1,
      allocationLink: 1,
      signalLink: 1,
    },
    arrowConfig: {
      defaultArrowLength: 8,
      defaultArrowRelPos: 1,
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
