import type { PermissionId } from "@torus-network/sdk/chain";

/**
 * Information about a permission attached to a namespace node
 */
export interface PermissionInfo {
  permissionId: PermissionId | "self";
  count: number | null;
  color: string;
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
 * Props for the main namespace path flow component
 */
export interface NamespacePathFlowProps {
  onCreatePermission?: (selectedPaths: string[]) => void;
}

/**
 * Props for the namespace path node component
 */
export interface NamespacePathNodeProps {
  data: NamespacePathNodeData;
  onPermissionSelect?: (
    nodeId: string,
    permissionId: PermissionId | "self" | null,
  ) => void;
}
