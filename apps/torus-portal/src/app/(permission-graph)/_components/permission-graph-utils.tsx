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

export const formatScope = (scope: string): string =>
  scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();

export const formatDuration = (seconds: string | number): string => {
  const numSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds;
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

export interface PermissionWithType extends GraphLink {
  type: "incoming" | "outgoing";
}

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

    if (link.source === node.id || link.target === node.id) {
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

export interface PermissionDetail {
  grantor_key: string;
  grantee_key: string;
  permission_id: string;
  scope: string;
  duration: string;
  execution_count: number;
  parent_id: string | null;
  createdAt: Date;
}

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

export const samplePermissionGraph: CustomGraphData = {
  nodes: [
    { id: "user", name: "User", color: "#ff6b6b", val: 10, role: "Grantor" },
    { id: "admin", name: "Admin", color: "#48dbfb", val: 10, role: "Both" },
    { id: "read", name: "Read", color: "#1dd1a1", val: 8, role: "Both" },
    { id: "write", name: "Write", color: "#f368e0", val: 8, role: "Both" },
    { id: "delete", name: "Delete", color: "#ff9f43", val: 8, role: "Both" },
    {
      id: "document",
      name: "Document",
      color: "#54a0ff",
      val: 12,
      role: "Grantee",
    },
    {
      id: "folder",
      name: "Folder",
      color: "#5f27cd",
      val: 12,
      role: "Grantee",
    },
    {
      id: "project",
      name: "Project",
      color: "#ee5253",
      val: 12,
      role: "Grantee",
    },
  ],
  links: [
    {
      source: "user",
      target: "read",
      id: "1",
      scope: "EMISSION",
      duration: "86400",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "user",
      target: "write",
      id: "2",
      scope: "EMISSION",
      duration: "172800",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "admin",
      target: "read",
      id: "3",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "admin",
      target: "write",
      id: "4",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "admin",
      target: "delete",
      id: "5",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "read",
      target: "document",
      id: "6",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "read",
      target: "folder",
      id: "7",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "write",
      target: "document",
      id: "8",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "delete",
      target: "document",
      id: "9",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
    {
      source: "folder",
      target: "project",
      id: "10",
      scope: "EMISSION",
      duration: "0",
      enforcement: "torus_enforcement_agent",
    },
  ],
};
