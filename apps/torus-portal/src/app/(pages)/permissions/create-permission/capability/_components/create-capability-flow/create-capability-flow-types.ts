import type { PermissionId } from "@torus-network/sdk/chain";

/**
 * Information about a permission attached to a namespace node
 */
export interface PermissionInfo {
  permissionId: PermissionId | "self";
  count: number | null;
  blocked?: boolean;
}

/**
 * Data structure for React Flow namespace path nodes
 */
export interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  accessible: boolean;
  permissions: PermissionInfo[];
  selectedPermission?: PermissionId | "self" | null;
}

/**
 * Path with its associated permission information
 */
export interface PathWithPermission {
  path: string;
  permissionId: PermissionId | null;
}

/**
 * Exposed methods from the capability flow component
 */
export interface CapabilityFlowRef {
  clearSelection: () => void;
}
