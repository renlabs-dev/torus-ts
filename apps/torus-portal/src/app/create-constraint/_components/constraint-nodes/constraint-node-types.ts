import type {
  BoolExprType,
  NumExprType,
  BaseConstraintType,
} from "@torus-ts/dsl";
import type { Node, Edge } from "@xyflow/react";

export interface BooleanNodeData extends Record<string, unknown> {
  type: "boolean";
  expression: BoolExprType;
  label: string;
}

export interface NumberNodeData extends Record<string, unknown> {
  type: "number";
  expression: NumExprType;
  label: string;
}

export interface BaseNodeData extends Record<string, unknown> {
  type: "base";
  expression: BaseConstraintType;
  label: string;
}

export interface PermissionIdNodeData extends Record<string, unknown> {
  type: "permissionId";
  permissionId: string;
  label: string;
}

export type PermissionNodeData =
  | BooleanNodeData
  | NumberNodeData
  | BaseNodeData
  | PermissionIdNodeData;

export interface NodeCreationResult {
  nodes: Node[];
  edges: Edge[];
}

export function createChildNodeId(
  parentId: string,
  childType: string,
  index?: number,
): string {
  const suffix = index !== undefined ? `-${index}` : "";
  return `${parentId}-${childType}${suffix}`;
}

export function createEdgeId(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`;
}
