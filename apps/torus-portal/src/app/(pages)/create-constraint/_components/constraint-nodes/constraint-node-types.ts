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

export type ConstraintNodeData =
  | BooleanNodeData
  | NumberNodeData
  | BaseNodeData
  | PermissionIdNodeData;

export interface NodeCreationResult {
  nodes: Node[];
  edges: Edge[];
}

export function createChildNodeId(parentId: string, childType: string): string {
  return `${parentId}-${childType}`;
}

export function createEdgeId(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`;
}
