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
  [key: string]: string | number | undefined;
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
  [key: string]: string | number | undefined;
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

// Sample permission graph data
// Agent cache data structure
export interface CachedAgentData {
  agentName: string;
  iconBlob: Blob | null; // Store the blob itself, not the URL
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
  // const hours = Math.floor((seconds % 86400) / 3600);
  // const minutes = Math.floor((seconds % 3600) / 60);

  return [
    days && `${days} day${days > 1 ? "s" : ""}`,
    // hours && `${hours} hour${hours > 1 ? 's' : ''}`,
    // minutes && `${minutes} minute${minutes > 1 ? 's' : ''}`
  ]
    .filter(Boolean)
    .join(", ");
};

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
      this.cache.delete(firstKey ?? "");
      // Note: We store blobs directly now, no URL cleanup needed here
    }

    // Add new item with current timestamp
    value.lastAccessed = Date.now();
    this.cache.set(key, value);
  }

  clear(): void {
    // No URL cleanup needed since we store blobs directly
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
