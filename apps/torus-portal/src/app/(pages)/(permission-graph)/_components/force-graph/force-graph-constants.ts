export const graphConstants = {
  physics: {
    linkDistance: 130,
    chargeStrength: -60,
    centerForceStrength: 0.5,
  },

  nodeConfig: {
    nodeColors: {
      default: "#6b7280",
      allocator: "#d1d1d1",

      userNode: "#d946ef",
      rootNode: "#63cbff",
      targetNode: "#1fdb77",

      signalNode: "#69ff5c",

      emissionPermissionNode: "#d1d1d1",
      namespacePermissionNode: "#f2b907",
    },
    nodeGeometry: {
      allocator: {
        type: "sphere",
        radius: 28,
        widthSegments: 36,
        heightSegments: 36,
      },
      rootNode: {
        type: "sphere",
        radius: 15,
        widthSegments: 24,
        heightSegments: 24,
      },
      permissionNode: {
        type: "icosahedron",
        radius: 6,
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
    linkWidth: 0.8,
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
      particleWidth: 3,
      particles: 1,
      speed: 0.008,
    },
  },
};
