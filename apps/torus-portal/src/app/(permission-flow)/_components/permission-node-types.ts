import type { Node, Edge } from "@xyflow/react";
import type { BoolExpr, NumExpr, BaseConstraint } from "../../../utils/dsl";

export interface BooleanNodeData {
  type: "boolean";
  expression: BoolExpr;
  label: string;
}

export interface NumberNodeData {
  type: "number";
  expression: NumExpr;
  label: string;
}

export interface BaseNodeData {
  type: "base";
  expression: BaseConstraint;
  label: string;
}

export type PermissionNodeData =
  | BooleanNodeData
  | NumberNodeData
  | BaseNodeData;

export type PermissionNode = Node<PermissionNodeData>;

export interface NodeCreationResult {
  nodes: PermissionNode[];
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
