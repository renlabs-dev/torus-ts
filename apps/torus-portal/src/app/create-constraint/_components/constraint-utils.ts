import type { Node, Edge } from "@xyflow/react";
import type {
  BoolExprType,
  NumExprType,
  BaseConstraintType,
  Constraint,
} from "../../../utils/dsl";
import type { PermissionNodeData } from "./constraint-nodes/constraint-node-types";

type NodeMap = Record<string, Node<PermissionNodeData>>;

type EdgeMap = Record<string, Edge[]>;

export function extractConstraintFromNodes(
  nodes: Node[],
  edges: Edge[],
  rootNodeId: string,
): Constraint | null {
  // Create lookup maps for efficient traversal
  const nodeMap: NodeMap = {};
  const edgeMap: EdgeMap = {};

  nodes.forEach((node) => {
    nodeMap[node.id] = node as Node<PermissionNodeData>;
  });

  edges.forEach((edge) => {
    if (!edgeMap[edge.source]) {
      edgeMap[edge.source] = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    edgeMap[edge.source]!.push(edge);
  });

  // Find the permission ID node
  const permissionIdNode = nodeMap["permission-id"];
  if (!permissionIdNode || permissionIdNode.data.type !== "permissionId") {
    console.error("Permission ID node not found or invalid");
    return null;
  }

  // Get the permission ID from the node
  const permissionId = permissionIdNode.data.permissionId;
  if (!permissionId || permissionId.trim() === "") {
    console.error("Permission ID is required");
    return null;
  }

  // Find the root node
  const rootNode = nodeMap[rootNodeId];
  if (!rootNode || rootNode.data.type !== "boolean") {
    console.error("Root node must be a boolean node");
    return null;
  }

  // Extract the boolean expression from the tree
  const boolExpr = extractBoolExpr(rootNode, nodeMap, edgeMap);
  if (!boolExpr) {
    console.error("Failed to extract boolean expression");
    return null;
  }

  // Create the constraint with the permission ID from the node
  const constraint: Constraint = {
    permId: permissionId,
    body: boolExpr,
  };

  return constraint;
}

function extractBoolExpr(
  node: Node<PermissionNodeData>,
  nodeMap: NodeMap,
  edgeMap: EdgeMap,
): BoolExprType | null {
  if (node.data.type !== "boolean") return null;

  const expr = node.data.expression;
  const childEdges = edgeMap[node.id] ?? [];

  switch (expr.$) {
    case "Not": {
      const childEdge = childEdges.find((e) => e.target.includes("-body"));
      if (!childEdge) return expr; // Return as-is if no child found

      const childNode = nodeMap[childEdge.target];
      if (!childNode || childNode.data.type !== "boolean") return expr;

      const body = extractBoolExpr(childNode, nodeMap, edgeMap);
      return body ? { $: "Not", body } : expr;
    }

    case "And":
    case "Or": {
      const leftEdge = childEdges.find((e) => e.target.includes("-left"));
      const rightEdge = childEdges.find((e) => e.target.includes("-right"));

      if (!leftEdge || !rightEdge) return expr;

      const leftNode = nodeMap[leftEdge.target];
      const rightNode = nodeMap[rightEdge.target];

      if (
        !leftNode ||
        !rightNode ||
        leftNode.data.type !== "boolean" ||
        rightNode.data.type !== "boolean"
      )
        return expr;

      const left = extractBoolExpr(leftNode, nodeMap, edgeMap);
      const right = extractBoolExpr(rightNode, nodeMap, edgeMap);

      if (!left || !right) return expr;

      return { $: expr.$, left, right };
    }

    case "CompExpr": {
      const leftEdge = childEdges.find((e) => e.target.includes("-left"));
      const rightEdge = childEdges.find((e) => e.target.includes("-right"));

      if (!leftEdge || !rightEdge) return expr;

      const leftNode = nodeMap[leftEdge.target];
      const rightNode = nodeMap[rightEdge.target];

      if (
        !leftNode ||
        !rightNode ||
        leftNode.data.type !== "number" ||
        rightNode.data.type !== "number"
      )
        return expr;

      const left = extractNumExpr(leftNode, nodeMap, edgeMap);
      const right = extractNumExpr(rightNode, nodeMap, edgeMap);

      if (!left || !right) return expr;

      return { $: "CompExpr", op: expr.op, left, right };
    }

    case "Base": {
      const childEdge = childEdges.find((e) => e.target.includes("-base"));
      if (!childEdge) return expr;

      const childNode = nodeMap[childEdge.target];
      if (!childNode || childNode.data.type !== "base") return expr;

      const body = extractBaseConstraint(childNode, nodeMap, edgeMap);
      return body ? { $: "Base", body } : expr;
    }

    default:
      return expr;
  }
}

function extractNumExpr(
  node: Node<PermissionNodeData>,
  nodeMap: NodeMap,
  edgeMap: EdgeMap,
): NumExprType | null {
  if (node.data.type !== "number") return null;

  const expr = node.data.expression;
  const childEdges = edgeMap[node.id] ?? [];

  switch (expr.$) {
    case "Add":
    case "Sub": {
      const leftEdge = childEdges.find((e) => e.target.includes("-left"));
      const rightEdge = childEdges.find((e) => e.target.includes("-right"));

      if (!leftEdge || !rightEdge) return expr;

      const leftNode = nodeMap[leftEdge.target];
      const rightNode = nodeMap[rightEdge.target];

      if (
        !leftNode ||
        !rightNode ||
        leftNode.data.type !== "number" ||
        rightNode.data.type !== "number"
      )
        return expr;

      const left = extractNumExpr(leftNode, nodeMap, edgeMap);
      const right = extractNumExpr(rightNode, nodeMap, edgeMap);

      if (!left || !right) return expr;

      return { $: expr.$, left, right };
    }

    default:
      return expr;
  }
}

function extractBaseConstraint(
  node: Node<PermissionNodeData>,
  nodeMap: NodeMap,
  edgeMap: EdgeMap,
): BaseConstraintType | null {
  if (node.data.type !== "base") return null;

  const expr = node.data.expression;
  const childEdges = edgeMap[node.id] ?? [];

  switch (expr.$) {
    case "MaxDelegationDepth": {
      const depthEdge = childEdges.find((e) => e.target.includes("-depth"));
      if (!depthEdge) return expr;

      const depthNode = nodeMap[depthEdge.target];
      if (!depthNode || depthNode.data.type !== "number") return expr;

      const depth = extractNumExpr(depthNode, nodeMap, edgeMap);
      return depth ? { $: "MaxDelegationDepth", depth } : expr;
    }

    case "RateLimit": {
      const maxOpsEdge = childEdges.find((e) => e.target.includes("-maxOps"));
      const periodEdge = childEdges.find((e) => e.target.includes("-period"));

      if (!maxOpsEdge || !periodEdge) return expr;

      const maxOpsNode = nodeMap[maxOpsEdge.target];
      const periodNode = nodeMap[periodEdge.target];

      if (
        !maxOpsNode ||
        !periodNode ||
        maxOpsNode.data.type !== "number" ||
        periodNode.data.type !== "number"
      )
        return expr;

      const maxOperations = extractNumExpr(maxOpsNode, nodeMap, edgeMap);
      const period = extractNumExpr(periodNode, nodeMap, edgeMap);

      if (!maxOperations || !period) return expr;

      return { $: "RateLimit", maxOperations, period };
    }

    default:
      return expr;
  }
}
