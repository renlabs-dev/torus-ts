import type { LinkObject, NodeObject } from "r3f-forcegraph";
import type { Object3D } from "three";

type PermissionIdentifier = string & { readonly __brand: unique symbol };

function isValidPermissionId(value: string): value is PermissionIdentifier {
  return value.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function createPermissionIdentifier(
  value: string,
): PermissionIdentifier {
  if (!isValidPermissionId(value)) {
    throw new Error(`Invalid permission ID: ${value}`);
  }
  return value;
}

export interface CustomGraphNode {
  id: string;
  name: string;
  color?: string;
  val?: number;
  fullAddress?: string;
  role?: string;
  customStyle?: GraphCustomNodeStyling;
  [key: string]: string | number | GraphCustomNodeStyling | undefined;
}

export interface GraphLink {
  linkType: string;
  source: string;
  target: string;
  id?: string;
  scope?: string;
  duration?: string;
  revocation?: number;
  enforcement?: string;
  executionCount?: number;
  parentId?: string;
  customStyle?: LinkCustomNodeStyling;
  [key: string]: string | number | LinkCustomNodeStyling | undefined;
}

export interface GraphCustomNodeStyling {
  nodeVisibility?: boolean | ((node: CustomGraphNode) => boolean);
  nodeLabel?: string | ((node: CustomGraphNode) => string);
  nodeAutoColorBy?: keyof CustomGraphNode;
  nodeThreeObject?: ((node: CustomGraphNode) => Object3D) | null;
  nodeThreeObjectExtend?: boolean;
  nodeOpacity?: number | ((node: CustomGraphNode) => number);
  nodeRelSize?: number | ((node: CustomGraphNode) => number);
  nodeResolution?: number | ((node: CustomGraphNode) => number);
  nodeColor?: string | ((node: CustomGraphNode) => string);
}

export interface LinkCustomNodeStyling {
  linkColor?: string | ((link: GraphLink) => string);
  linkWidth?: number | ((link: GraphLink) => number);
  linkDirectionalArrowLength?: number | ((link: GraphLink) => number);
  linkDirectionalArrowColor?: string | ((link: GraphLink) => string);
  linkDirectionalArrowRelPos?: number | ((link: GraphLink) => number);
  linkCurvature?: number | ((link: GraphLink) => number);
  linkVisibility?: boolean | ((link: GraphLink) => boolean);
  linkLabel?: string | ((link: GraphLink) => string);
  linkOpacity?: number | ((link: GraphLink) => number);
  linkAutoColorBy?: keyof GraphLink;
}

export interface CustomGraphData {
  nodes: CustomGraphNode[];
  links: GraphLink[];
}

export interface PermissionWithType extends GraphLink {
  type: "incoming" | "outgoing";
}

export interface PermissionDetail {
  grantor_key: string;
  grantee_key: string;
  permission_id: string;
  scope: string;
  duration: string;
  revocation: number;
  last_execution: Date | null;
  execution_count: number;
  parent_id: string | null;
  constraint_id: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CachedAgentData {
  agentName: string;
  iconBlob: Blob | null;
  socials: Record<string, string>;
  currentBlock: number;
  weightFactor: number;
  lastAccessed: number;
}

export const formatScope = (scope: string): string =>
  scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();

export const formatDuration = (seconds: string | number): string => {
  const numSeconds = typeof seconds === "string" ? parseInt(seconds) : seconds;
  if (!numSeconds) return "No expiration";

  const days = Math.floor(numSeconds / 86400);
  return (days && `${days} day${days > 1 ? "s" : ""}`) || "No expiration";
};

// Default styles
const DEFAULT_NODE_COLOR = "#ffffff";
const DEFAULT_NODE_REL_SIZE = 3;
const DEFAULT_NODE_RESOLUTION = 24;
const DEFAULT_NODE_OPACITY = 1;

const DEFAULT_LINK_COLOR = "rgba(255, 255, 255, 1)";
const DEFAULT_LINK_WIDTH = 0.3;
const DEFAULT_LINK_CURVATURE = 0.3;
const DEFAULT_LINK_OPACITY = 0.3;
const DEFAULT_LINK_ARROW_LENGTH = 3.5;
const DEFAULT_LINK_ARROW_REL_POS = 1;

// Helper to safely get node ID
function getNodeId(node: NodeObject): string {
  if (typeof node.id === "string") {
    return node.id;
  }
  // Fallback for any edge cases
  return String(node.id);
}

// Helper to safely get source/target IDs from link
function getLinkSourceTargetIds(link: LinkObject): {
  sourceId: string;
  targetId: string;
} {
  let sourceId: string;
  let targetId: string;

  if (
    typeof link.source === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    link.source !== null &&
    "id" in link.source
  ) {
    sourceId = getNodeId(link.source);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    sourceId = String(link.source);
  }

  if (
    typeof link.target === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    link.target !== null &&
    "id" in link.target
  ) {
    targetId = String(link.target.id);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    targetId = String(link.target);
  }

  return { sourceId, targetId };
}

// Node color getter
export const getNodeColor = (
  node: NodeObject,
  graphData: CustomGraphData,
): string => {
  const nodeId = getNodeId(node);
  const graphNode = graphData.nodes.find((n) => n.id === nodeId);

  if (!graphNode) {
    return DEFAULT_NODE_COLOR;
  }

  // Check custom style first
  if (graphNode.customStyle?.nodeColor) {
    const customColor = graphNode.customStyle.nodeColor;
    if (typeof customColor === "function") {
      return customColor(graphNode);
    }
    return customColor;
  }

  // Fallback to direct color property
  return graphNode.color ?? DEFAULT_NODE_COLOR;
};

// Link color getter
export const getLinkColor = (
  link: LinkObject,
  graphData: CustomGraphData,
): string => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_COLOR;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkColor) {
    const customColor = graphLink.customStyle.linkColor;
    if (typeof customColor === "function") {
      return customColor(graphLink);
    }
    return customColor;
  }

  // Default based on link type
  if (graphLink.linkType === "allocation") {
    return "#ff6b6b";
  }
  return DEFAULT_LINK_COLOR;
};

// Link width getter
export const getLinkWidth = (
  link: LinkObject,
  graphData: CustomGraphData,
): number => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_WIDTH;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkWidth) {
    const customWidth = graphLink.customStyle.linkWidth;
    if (typeof customWidth === "function") {
      return customWidth(graphLink);
    }
    return customWidth;
  }

  // Default based on link type
  if (graphLink.linkType === "allocation" && graphLink.duration) {
    const percentage = parseFloat(graphLink.duration.replace("%", "") || "0");
    return Math.max(1, percentage / 10);
  }
  return DEFAULT_LINK_WIDTH;
};

// Link curvature getter
export const getLinkCurvature = (
  link: LinkObject,
  graphData: CustomGraphData,
): number => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_CURVATURE;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkCurvature) {
    const customCurvature = graphLink.customStyle.linkCurvature;
    if (typeof customCurvature === "function") {
      return customCurvature(graphLink);
    }
    return customCurvature;
  }

  return graphLink.linkType === "allocation" ? 0.2 : DEFAULT_LINK_CURVATURE;
};

// Link opacity getter
export const getLinkOpacity = (
  link: LinkObject,
  graphData: CustomGraphData,
): number => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_OPACITY;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkOpacity) {
    const customOpacity = graphLink.customStyle.linkOpacity;
    if (typeof customOpacity === "function") {
      return customOpacity(graphLink);
    }
    return customOpacity;
  }

  return graphLink.linkType === "allocation" ? 0.8 : DEFAULT_LINK_OPACITY;
};

// Link arrow length getter
export const getLinkArrowLength = (
  link: LinkObject,
  graphData: CustomGraphData,
): number => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_ARROW_LENGTH;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkDirectionalArrowLength) {
    const customLength = graphLink.customStyle.linkDirectionalArrowLength;
    if (typeof customLength === "function") {
      return customLength(graphLink);
    }
    return customLength;
  }

  return graphLink.linkType === "allocation" ? 6 : DEFAULT_LINK_ARROW_LENGTH;
};

// Link arrow relative position getter
export const getLinkArrowRelPos = (
  link: LinkObject,
  graphData: CustomGraphData,
): number => {
  const { sourceId, targetId } = getLinkSourceTargetIds(link);

  const graphLink = graphData.links.find(
    (l) => l.source === sourceId && l.target === targetId,
  );

  if (!graphLink) {
    return DEFAULT_LINK_ARROW_REL_POS;
  }

  // Check custom style first
  if (graphLink.customStyle?.linkDirectionalArrowRelPos) {
    const customPos = graphLink.customStyle.linkDirectionalArrowRelPos;
    if (typeof customPos === "function") {
      return customPos(graphLink);
    }
    return customPos;
  }

  return DEFAULT_LINK_ARROW_REL_POS;
};

// Node relative size getter
export const getNodeRelSize = (
  node: NodeObject,
  graphData: CustomGraphData,
): number => {
  const nodeId = getNodeId(node);
  const graphNode = graphData.nodes.find((n) => n.id === nodeId);

  if (!graphNode) {
    return DEFAULT_NODE_REL_SIZE;
  }

  // Check custom style first
  if (graphNode.customStyle?.nodeRelSize) {
    const customSize = graphNode.customStyle.nodeRelSize;
    if (typeof customSize === "function") {
      return customSize(graphNode);
    }
    return customSize;
  }

  return graphNode.role === "Allocator" ? 5 : DEFAULT_NODE_REL_SIZE;
};

// Node resolution getter
export const getNodeResolution = (
  node: NodeObject,
  graphData: CustomGraphData,
): number => {
  const nodeId = getNodeId(node);
  const graphNode = graphData.nodes.find((n) => n.id === nodeId);

  if (!graphNode) {
    return DEFAULT_NODE_RESOLUTION;
  }

  // Check custom style first
  if (graphNode.customStyle?.nodeResolution) {
    const customRes = graphNode.customStyle.nodeResolution;
    if (typeof customRes === "function") {
      return customRes(graphNode);
    }
    return customRes;
  }

  return graphNode.role === "Allocator" ? 32 : DEFAULT_NODE_RESOLUTION;
};

// Other utility functions
export const getAllocatorBaseUrl = (override?: string): string => {
  if (override) return override;

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const isTestnet =
    hostname.includes("testnet") || hostname.includes("localhost");

  return isTestnet
    ? "https://allocator.testnet.torus.network/agent/"
    : "https://allocator.torus.network/agent/";
};

export const getNodePermissions = (
  node: CustomGraphNode,
  graphData: CustomGraphData,
): PermissionWithType[] => {
  const permissionsMap = new Map<string, PermissionWithType>();

  graphData.links.forEach((link) => {
    const key = `${link.source}-${link.target}`;

    if (
      (link.source === node.id || link.target === node.id) &&
      link.linkType === "permission"
    ) {
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          ...link,
          type: link.source === node.id ? "outgoing" : "incoming",
        });
      }
    }
  });

  return Array.from(permissionsMap.values());
};

export const sortPermissions = (
  permissions: PermissionWithType[],
  permissionDetails: PermissionDetail[],
): PermissionWithType[] => {
  return permissions.sort((a, b) => {
    const detailsA = permissionDetails.find(
      (p) => p.grantor_key === a.source && p.grantee_key === a.target,
    );
    const detailsB = permissionDetails.find(
      (p) => p.grantor_key === b.source && p.grantee_key === b.target,
    );

    const idA = detailsA?.permission_id ?? "";
    const idB = detailsB?.permission_id ?? "";

    return Number(idA) - Number(idB);
  });
};

// LRU Cache for agent data
export class AgentLRUCache {
  private cache = new Map<string, CachedAgentData>();
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  get(key: string): CachedAgentData | null {
    const item = this.cache.get(key);
    if (item) {
      // Update last accessed time and move to end (most recent)
      item.lastAccessed = Date.now();
      this.cache.delete(key);
      this.cache.set(key, item);
      return item;
    }
    return null;
  }

  set(key: string, value: CachedAgentData): void {
    // If key exists, remove it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If cache is full, remove least recently used item
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new item with current timestamp
    value.lastAccessed = Date.now();
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
