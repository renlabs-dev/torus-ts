import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";
import type { LinkObject, NodeObject } from "r3f-forcegraph";
import type { InferSelectModel } from "drizzle-orm";
import type { 
  permissionsSchema, 
  emissionPermissionsSchema, 
  namespacePermissionsSchema,
  emissionStreamAllocationsSchema,
  emissionDistributionTargetsSchema,
  accumulatedStreamAmountsSchema
} from "@torus-ts/db/schema";

export interface CustomGraphNode extends NodeObject {
  id: string;
  name: string;
  color?: string;
  val?: number;
  fullAddress?: string;
  role?: string;
  nodeType?: "allocator" | "root_agent" | "permission" | "target_agent" | "signal";
  signalData?: SignalData;
  permissionData?: PermissionNodeData;
  agentData?: AgentNodeData;
}

export interface PermissionNodeData {
  permissionId: string;
  permissionType: "emission" | "namespace";
  grantorAccountId: string;
  granteeAccountId: string;
  scope?: string;
  duration?: string | null;
}

export interface AgentNodeData {
  accountId: string;
  isWhitelisted?: boolean;
  isAllocated?: boolean;
}

export interface SignalData {
  id: number;
  title: string;
  description: string;
  proposedAllocation: number;
  agentKey: string;
  discord?: string | null;
  github?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  createdAt: Date;
}

export interface CustomGraphLink extends LinkObject {
  linkType: "allocation" | "permission_ownership" | "permission_target" | "signal";
  id?: string;
  scope?: string;
  // Link Customization
  linkDirectionalParticles?: number;
  linkDirectionalParticleWidth?: number;
  linkColor?: string;
  linkDirectionalArrowLength?: number;
  linkDirectionalArrowRelPos?: number;
  linkDirectionalParticleSpeed?: number;
  linkDirectionalParticleResolution?: number;
  linkWidth?: number;
}

export interface CustomGraphData {
  nodes: CustomGraphNode[];
  links: CustomGraphLink[];
}

export interface PermissionWithType extends CustomGraphLink {
  type: "incoming" | "outgoing";
  permissionType?: "emission" | "namespace";
  originalData?: PermissionWithDetails;
}

// Database types for the new permission structure
export type PermissionData = InferSelectModel<typeof permissionsSchema>;
export type EmissionPermissionData = InferSelectModel<typeof emissionPermissionsSchema>;
export type NamespacePermissionData = InferSelectModel<typeof namespacePermissionsSchema>;
export type StreamAllocationData = InferSelectModel<typeof emissionStreamAllocationsSchema>;
export type DistributionTargetData = InferSelectModel<typeof emissionDistributionTargetsSchema>;
export type AccumulatedStreamData = InferSelectModel<typeof accumulatedStreamAmountsSchema>;

// The complete permission data structure from the new API
export interface PermissionWithDetails {
  permissions: PermissionData;
  emission_permissions: EmissionPermissionData | null;
  namespace_permissions: NamespacePermissionData | null;
}

// Type for the new permission API response
export type PermissionDetailsBase = NonNullable<
  inferProcedureOutput<AppRouter["permission"]["allWithCompletePermissions"]>
>;

// Enhanced permission details with computed fields for graph display
export type PermissionDetails = (PermissionDetailsBase[number] & {
  remainingBlocks?: number;
  permissionType?: "emission" | "namespace";
  executionCount?: number;
})[];

export type ComputedWeightsList = NonNullable<
  inferProcedureOutput<AppRouter["computedAgentWeight"]["all"]>
>;

export type SignalsList = NonNullable<
  inferProcedureOutput<AppRouter["signal"]["all"]>
>;

export interface CachedAgentData {
  agentName: string;
  iconBlob: Blob | null;
  socials: Record<string, string>;
  currentBlock: number;
  weightFactor: number;
  lastAccessed: number;
}
