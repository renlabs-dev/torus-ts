import type { inferProcedureOutput } from "@trpc/server";
import type { LinkObject, NodeObject } from "r3f-forcegraph";
import type * as THREE from "three";

import type { AppRouter } from "@torus-ts/api";

export interface CustomGraphNode extends NodeObject {
  id: string;
  name: string;
  color?: string;
  val?: number;
  fullAddress?: string;
  role?: string;
  nodeType?:
    | "allocator"
    | "root_agent"
    | "permission"
    | "target_agent"
    | "signal";
  signalData?: SignalData;
  permissionData?: PermissionNodeData;
  agentData?: AgentNodeData;
  // Pre-computed Three.js objects for performance
  precomputedGeometry?: THREE.BufferGeometry;
  precomputedMaterial?: THREE.Material;
}

interface PermissionNodeData {
  permissionId: string;
  permissionType: "emission" | "capability";
  delegatorAccountId: string;
  recipientAccountId: string;
  scope?: string;
  duration?: string | null;
  namespacePaths?: string[];
}

interface AgentNodeData {
  accountId: string;
  isWhitelisted?: boolean;
  isAllocated?: boolean;
}

interface SignalData {
  id: number;
  title: string;
  description: string;
  proposedAllocation: number;
  fulfilled: boolean;
  agentKey: string;
  discord?: string | null;
  github?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  createdAt: Date;
}

export interface CustomGraphLink extends LinkObject {
  linkType:
    | "allocation"
    | "permission_ownership"
    | "permission_target"
    | "permission_grant"
    | "permission_receive"
    | "signal";
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

export interface CustomGraphLinkWithType extends CustomGraphLink {
  type: "incoming" | "outgoing";
}

// Type for the new permission API response
export type allPermissions = NonNullable<
  inferProcedureOutput<AppRouter["permission"]["allWithCompletePermissions"]>
>;

export type ComputedWeightsList = NonNullable<
  inferProcedureOutput<AppRouter["computedAgentWeight"]["all"]>
>;

export type SignalsList = NonNullable<
  inferProcedureOutput<AppRouter["signal"]["all"]>
>;

export interface CachedAgentData {
  agentName: string;
  shortDescription: string;
  iconBlob: Blob | null;
  socials: Record<string, string>;
  currentBlock: number;
  weightFactor: number;
  lastAccessed: number;
}
