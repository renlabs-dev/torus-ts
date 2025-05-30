import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";
import type { LinkObject, NodeObject } from "r3f-forcegraph";

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

export interface CustomGraphNode extends NodeObject {
  id: string;
  name: string;
  color?: string;
  val?: number;
  fullAddress?: string;
  role?: string;
  fx?: number; 
  fy?: number; 
  fz?: number;
}

export interface CustomGraphLink extends LinkObject {
  linkType: string;
  id?: string;
  scope?: string;
  duration?: string;
  revocation?: number;
  enforcement?: string;
  executionCount?: number;
  parentId?: string;
  // Link Customization
  linkDirectionalParticles?: number;
  linkDirectionalParticleWidth?: number;
  linkDirectionalArrowLength?: number;
  linkDirectionalArrowRelPos?: number;
  linkCurvature?: number;
  linkColor?: string;
  linkWidth: number;
}

export interface CustomGraphData {
  nodes: CustomGraphNode[];
  links: CustomGraphLink[];
}

export interface PermissionWithType extends CustomGraphLink {
  type: "incoming" | "outgoing";
}

export type PermissionDetails = NonNullable<
  inferProcedureOutput<AppRouter["permissionDetails"]["all"]>
>;

export interface CachedAgentData {
  agentName: string;
  iconBlob: Blob | null;
  socials: Record<string, string>;
  currentBlock: number;
  weightFactor: number;
  lastAccessed: number;
}
