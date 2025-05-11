// Types for graph data
export interface GraphNode {
  id: string;
  name: string;
  color?: string;
  val?: number;
  [key: string]: any;
}

export interface GraphLink {
  source: string;
  target: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Generate a random tree-like structure for demo purposes
export function generateRandomTree(numNodes: number = 20): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Node colors
  const colors = [
    "#ff6b6b", // Red
    "#48dbfb", // Blue
    "#1dd1a1", // Green
    "#f368e0", // Pink
    "#ff9f43", // Orange
    "#54a0ff", // Light Blue
    "#5f27cd", // Purple
    "#ee5253", // Dark Red
    "#01a3a4", // Teal
  ];

  // Create nodes
  for (let i = 0; i < numNodes; i++) {
    const colorIndex = Math.floor(Math.random() * colors.length);
    nodes.push({
      id: `node${i}`,
      name: `Node ${i}`,
      color: colors[colorIndex],
      val: Math.random() * 10 + 1, // Random size between 1-11
    });
  }

  // Create links (ensure tree-like structure to avoid cycles)
  for (let i = 1; i < numNodes; i++) {
    // Each node connects to a node with a lower index
    const targetIndex = Math.floor(Math.random() * i);
    links.push({
      source: `node${i}`,
      target: `node${targetIndex}`,
    });

    // Occasionally add extra connections to make it more interesting
    if (Math.random() > 0.7 && i > 2) {
      const extraTarget = Math.floor(Math.random() * i);
      if (extraTarget !== targetIndex) {
        links.push({
          source: `node${i}`,
          target: `node${extraTarget}`,
        });
      }
    }
  }

  return { nodes, links };
}

// Sample permission graph data
export const samplePermissionGraph: GraphData = {
  nodes: [
    { id: "user", name: "User", color: "#ff6b6b", val: 10 },
    { id: "admin", name: "Admin", color: "#48dbfb", val: 10 },
    { id: "read", name: "Read", color: "#1dd1a1", val: 8 },
    { id: "write", name: "Write", color: "#f368e0", val: 8 },
    { id: "delete", name: "Delete", color: "#ff9f43", val: 8 },
    { id: "document", name: "Document", color: "#54a0ff", val: 12 },
    { id: "folder", name: "Folder", color: "#5f27cd", val: 12 },
    { id: "project", name: "Project", color: "#ee5253", val: 12 },
  ],
  links: [
    { source: "user", target: "read" },
    { source: "user", target: "write" },
    { source: "admin", target: "read" },
    { source: "admin", target: "write" },
    { source: "admin", target: "delete" },
    { source: "read", target: "document" },
    { source: "read", target: "folder" },
    { source: "write", target: "document" },
    { source: "delete", target: "document" },
    { source: "folder", target: "project" },
  ],
};
