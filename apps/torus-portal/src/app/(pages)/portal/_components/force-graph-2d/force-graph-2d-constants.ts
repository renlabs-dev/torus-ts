/**
 * Constants specific to the 2D force graph visualization.
 * These are separate from the 3D graph constants to allow independent styling.
 */
export const graph2DConstants = {
  nodeConfig: {
    // Base fill colors - darker fills with bright borders (tech aesthetic)
    nodeColors: {
      default: "#1a2332",
      allocator: "#1a2332",

      userNode: "#2d1f3d",
      rootNode: "#1a2942",
      targetNode: "#1a2942",

      signalNode: "#1a2942",

      emissionPermissionNode: "#2a1a0a",
      namespacePermissionNode: "#2a1a0a",
    },
    // Border/stroke colors for the tech aesthetic
    nodeBorderColors: {
      default: "#4cc9f0",
      allocator: "#4cc9f0",

      userNode: "#d946ef",
      rootNode: "#4cc9f0",
      targetNode: "#4cc9f0",

      signalNode: "#4cc9f0",

      emissionPermissionNode: "#f59e0b",
      namespacePermissionNode: "#f59e0b",
    },
    // Glow colors (slightly brighter than borders)
    nodeGlowColors: {
      default: "#4cc9f0",
      allocator: "#63d9ff",

      userNode: "#e879f9",
      rootNode: "#63d9ff",
      targetNode: "#63d9ff",

      signalNode: "#63d9ff",

      emissionPermissionNode: "#fbbf24",
      namespacePermissionNode: "#fbbf24",
    },
    nodeGeometry: {
      allocator: {
        radius: 28,
      },
      rootNode: {
        radius: 15,
      },
      permissionNode: {
        radius: 8,
      },
      targetNode: {
        radius: 13,
      },
      userNode: {
        radius: 13,
      },
      signalNode: {
        radius: 8,
      },
    },
  },

  linkConfig: {
    linkColors: {
      allocatorLink: "#4cc9f0",
      rootNodeLink: "#4cc9f0",
      emissionPermissionLink: "#f59e0b",
      namespacePermissionLink: "#f59e0b",
      targetNodeLink: "#4cc9f0",
      userNodeLink: "#d946ef",

      signalLink: "#4cc9f0",
      defaultLink: "#4a5568",

      // Causal/hierarchy connections (gray/white)
      causalLink: "#6b7280",
    },
    linkWidth: 1.2,
    arrowConfig: {
      defaultArrowLength: 8,
      defaultArrowRelPos: 0.85,
    },
  },
};
