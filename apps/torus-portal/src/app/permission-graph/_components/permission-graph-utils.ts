export interface CustomGraphNode {
  id: string;
  name: string;
  color?: string;
  val?: number;
  [key: string]: string | number | undefined;
}

export interface GraphLink {
  source: string;
  target: string;
  [key: string]: string | number | undefined;
}

export interface CustomGraphData {
  nodes: CustomGraphNode[];
  links: GraphLink[];
}

// Sample permission graph data
export const samplePermissionGraph: CustomGraphData = {
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
