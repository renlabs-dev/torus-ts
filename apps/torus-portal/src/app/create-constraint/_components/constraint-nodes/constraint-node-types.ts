import type { Node, Edge } from "@xyflow/react";
import type { BoolExpr, NumExpr, BaseConstraint } from "../../../../utils/dsl";

export interface BooleanNodeData extends Record<string, unknown> {
  type: "boolean";
  expression: BoolExpr;
  label: string;
}

export interface NumberNodeData extends Record<string, unknown> {
  type: "number";
  expression: NumExpr;
  label: string;
}

export interface BaseNodeData extends Record<string, unknown> {
  type: "base";
  expression: BaseConstraint;
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

export type PermissionNode = Node<PermissionNodeData>;

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
