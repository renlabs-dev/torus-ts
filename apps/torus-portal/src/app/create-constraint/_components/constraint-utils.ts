import type { Node, Edge } from "@xyflow/react";

import type { PermissionNodeData } from "./constraint-nodes/constraint-node-types";
import { constraintValidationSchema } from "./constraint-validation-schemas";
import type {
  BaseConstraintType,
  BoolExprType,
  Constraint,
  NumExprType,
} from "@torus-ts/dsl";

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

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  constraint?: Constraint;
}

export function validateConstraintForm(
  nodes: Node[],
  edges: Edge[],
  rootNodeId: string,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check permission ID node
  const permissionIdNode = nodes.find((node) => node.id === "permission-id");
  if (!permissionIdNode || permissionIdNode.data.type !== "permissionId") {
    errors.push({
      nodeId: "permission-id",
      field: "permissionId",
      message: "Permission ID node not found",
    });
  } else {
    const permissionId = permissionIdNode.data.permissionId;
    if (!permissionId) {
      errors.push({
        nodeId: "permission-id",
        field: "permissionId",
        message: "Permission ID is required",
      });
    }
  }

  // Validate all nodes for missing required fields
  validateNodeFields(nodes, errors);

  // If there are validation errors, return early
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  // Try to extract and validate constraint
  try {
    const constraint = extractConstraintFromNodes(nodes, edges, rootNodeId);
    if (!constraint) {
      errors.push({
        nodeId: rootNodeId,
        field: "constraint",
        message: "Failed to build constraint from nodes",
      });
      return {
        isValid: false,
        errors,
      };
    }

    // Validate against schema
    const validationResult = constraintValidationSchema.safeParse(constraint);
    if (!validationResult.success) {
      // Convert Zod errors to our format
      validationResult.error.errors.forEach((error) => {
        errors.push({
          nodeId: "constraint",
          field: error.path.join("."),
          message: error.message,
        });
      });

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      errors: [],
      constraint,
    };
  } catch (error) {
    errors.push({
      nodeId: "constraint",
      field: "general",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });

    return {
      isValid: false,
      errors,
    };
  }
}

function validateNodeFields(nodes: Node[], errors: ValidationError[]) {
  nodes.forEach((node) => {
    const nodeData = node.data as PermissionNodeData;

    switch (nodeData.type) {
      case "number": {
        const expr = nodeData.expression;
        switch (expr.$) {
          case "UIntLiteral":
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (expr.value === undefined || expr.value === null) {
              errors.push({
                nodeId: node.id,
                field: "value",
                message: "Value is required",
              });
            }
            break;
          case "StakeOf":
            if (!expr.account || String(expr.account).trim() === "") {
              errors.push({
                nodeId: node.id,
                field: "account",
                message: "Account ID is required",
              });
            }
            break;
        }
        break;
      }
      case "base": {
        const expr = nodeData.expression;
        switch (expr.$) {
          case "PermissionExists":
          case "PermissionEnabled":
            if (!expr.pid || String(expr.pid).trim() === "") {
              errors.push({
                nodeId: node.id,
                field: "pid",
                message: "Permission ID is required",
              });
            }
            break;
        }
        break;
      }
    }
  });
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

  // For current BaseConstraintType variants, all fields are simple values
  // No child node extraction needed
  return expr;
}
