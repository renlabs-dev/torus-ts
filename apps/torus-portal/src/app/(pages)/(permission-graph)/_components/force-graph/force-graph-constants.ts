export const graphConstants = {
  physics: {
    linkDistance: 130,
    chargeStrength: -60,
    centerForceStrength: 0.5,
  },

  nodeConfig: {
    nodeColors: {
      default: "#6b7280",
      allocator: "#ffffff",

      userNode: "#d946ef",
      rootNode: "#7ac3ff",
      targetNode: "#10b981",

      signalNode: "#69ff5c",

      emissionPermissionNode: "#ffffff",
      namespacePermissionNode: "#eab308",
    },
    nodeGeometry: {
      allocator: {
        type: "sphere",
        radius: 28,
        widthSegments: 24,
        heightSegments: 24,
      },
      rootNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 20,
        heightSegments: 20,
      },
      permissionNode: {
        type: "icosahedron",
        radius: 6,
        detail: 0,
      },
      targetNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 20,
        heightSegments: 20,
      },
      userNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 20,
        heightSegments: 20,
      },
      signalNode: {
        type: "tetrahedron",
        radius: 8,
        detail: 0,
      },
    },
  },

  linkConfig: {
    linkColors: {
      allocatorLink: "#ffffff",
      rootNodeLink: "#3b82f6",
      emissionPermissionLink: "#ffffff",
      namespacePermissionLink: "#eab308",
      targetNodeLink: "#10b981",
      userNodeLink: "#0ea5e9",

      signalLink: "#69ff5c",
      defaultLink: "#6b7280",
    },
    linkWidth: 0.5,
    arrowConfig: {
      defaultArrowLength: 6,
      defaultArrowRelPos: 0.93,
    },
    particleAnimation: {
      speedMin: 0.002,
      speedMax: 0.006,
      resolution: 1,
      minParticles: 0.8,
      defaultSpeed: 0.008,
    },
    particleConfig: {
      particleWidth: 2,
      particles: 1,
      speed: 0.008,
    },
  },
};
