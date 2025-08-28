import { CONSTANTS } from "@torus-network/sdk/constants";
import type {
  CachedAgentData,
  CustomGraphData,
  CustomGraphLinkWithType,
  CustomGraphNode,
} from "./permission-graph-types";

export const formatScope = (scope: string): string =>
  scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase();

// Convert remaining blocks to days
const blocksToDays = (blocks: number): number => {
  if (blocks >= 999999999) {
    // Special case for indefinite permissions
    return 999999999;
  }
  const blocksPerDay =
    CONSTANTS.TIME.ONE_DAY / CONSTANTS.TIME.BLOCK_TIME_SECONDS;
  return Math.ceil(blocks / blocksPerDay);
};

// Format duration for display
export const formatDuration = (
  blocks: number,
  isIndefinite?: boolean,
): string => {
  if (isIndefinite || blocks >= 999999999) {
    return "Indefinite";
  }

  const days = blocksToDays(blocks);
  if (days === 0) return "Expired";
  if (days === 1) return "1 day";
  return `${days} days`;
};

export const getNodePermissions = (
  node: CustomGraphNode,
  graphData: CustomGraphData,
): CustomGraphLinkWithType[] => {
  const permissionsMap = new Map<string, CustomGraphLinkWithType>();

  graphData.links.forEach((link) => {
    const sourceId =
      typeof link.source === "object" ? link.source.id : link.source;
    const targetId =
      typeof link.target === "object" ? link.target.id : link.target;
    const key = `${sourceId}-${targetId}`;

    if (
      (sourceId === node.id || targetId === node.id) &&
      (link.linkType === "permission_grant" ||
        link.linkType === "permission_receive" ||
        link.linkType === "permission_target" ||
        link.linkType === "permission_ownership")
    ) {
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          ...link,
          // Use normalized IDs to determine direction reliably
          type: sourceId === node.id ? "outgoing" : "incoming",
        });
      }
    }
  });

  return Array.from(permissionsMap.values());
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
