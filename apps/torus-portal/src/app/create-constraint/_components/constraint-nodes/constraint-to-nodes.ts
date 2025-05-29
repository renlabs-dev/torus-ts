import type { Node, Edge } from "@xyflow/react";

import type { PermissionNodeData } from "./constraint-node-types";
import { createChildNodeId, createEdgeId } from "./constraint-node-types";
import type {
  BaseConstraintType,
  BoolExprType,
  Constraint,
  NumExprType,
} from "~/utils/dsl";

export function constraintToNodes(constraint: Constraint): {
  nodes: Node<PermissionNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<PermissionNodeData>[] = [];
  const edges: Edge[] = [];

  // Create permission ID node (always start with empty permission ID)
  const permissionIdNode: Node<PermissionNodeData> = {
    id: "permission-id",
    type: "permissionId",
    data: {
      type: "permissionId",
      permissionId: "",
      label: "Permission ID",
    },
    position: { x: 0, y: -100 },
  };

  nodes.push(permissionIdNode);

  // Create root node
  const rootId = "root-boolean";
  const rootNode: Node<PermissionNodeData> = {
    id: rootId,
    type: "permissionBoolean",
    data: {
      type: "boolean",
      expression: constraint.body,
      label: "Permission Root",
    },
    position: { x: 0, y: 0 },
  };

  nodes.push(rootNode);

  // Connect permission ID node to root node
  edges.push({
    id: "permission-id-root-boolean",
    source: "permission-id",
    target: "root-boolean",
    animated: true,
  });

  // Convert the constraint body recursively
  convertBoolExpr(constraint.body, rootId, nodes, edges);

  return { nodes, edges };
}

function convertBoolExpr(
  expr: BoolExprType,
  parentId: string,
  nodes: Node<PermissionNodeData>[],
  edges: Edge[],
): void {
  switch (expr.$) {
    case "Not": {
      const bodyId = createChildNodeId(parentId, "body");
      const bodyNode: Node<PermissionNodeData> = {
        id: bodyId,
        type: "permissionBoolean",
        data: {
          type: "boolean",
          expression: expr.body,
          label: getBoolExprLabel(expr.body),
        },
        position: { x: 0, y: 0 },
      };

      nodes.push(bodyNode);
      edges.push({
        id: createEdgeId(parentId, bodyId),
        source: parentId,
        target: bodyId,
        animated: true,
      });

      convertBoolExpr(expr.body, bodyId, nodes, edges);
      break;
    }

    case "And":
    case "Or": {
      const leftId = createChildNodeId(parentId, "left");
      const rightId = createChildNodeId(parentId, "right");

      const leftNode: Node<PermissionNodeData> = {
        id: leftId,
        type: "permissionBoolean",
        data: {
          type: "boolean",
          expression: expr.left,
          label: getBoolExprLabel(expr.left),
        },
        position: { x: 0, y: 0 },
      };

      const rightNode: Node<PermissionNodeData> = {
        id: rightId,
        type: "permissionBoolean",
        data: {
          type: "boolean",
          expression: expr.right,
          label: getBoolExprLabel(expr.right),
        },
        position: { x: 0, y: 0 },
      };

      nodes.push(leftNode, rightNode);
      edges.push(
        {
          id: createEdgeId(parentId, leftId),
          source: parentId,
          target: leftId,
          animated: true,
        },
        {
          id: createEdgeId(parentId, rightId),
          source: parentId,
          target: rightId,
          animated: true,
        },
      );

      convertBoolExpr(expr.left, leftId, nodes, edges);
      convertBoolExpr(expr.right, rightId, nodes, edges);
      break;
    }

    case "CompExpr": {
      const leftId = createChildNodeId(parentId, "left");
      const rightId = createChildNodeId(parentId, "right");

      const leftNode: Node<PermissionNodeData> = {
        id: leftId,
        type: "permissionNumber",
        data: {
          type: "number",
          expression: expr.left,
          label: getNumExprLabel(expr.left),
        },
        position: { x: 0, y: 0 },
      };

      const rightNode: Node<PermissionNodeData> = {
        id: rightId,
        type: "permissionNumber",
        data: {
          type: "number",
          expression: expr.right,
          label: getNumExprLabel(expr.right),
        },
        position: { x: 0, y: 0 },
      };

      nodes.push(leftNode, rightNode);
      edges.push(
        {
          id: createEdgeId(parentId, leftId),
          source: parentId,
          target: leftId,
          animated: true,
        },
        {
          id: createEdgeId(parentId, rightId),
          source: parentId,
          target: rightId,
          animated: true,
        },
      );

      convertNumExpr(expr.left, leftId, nodes, edges);
      convertNumExpr(expr.right, rightId, nodes, edges);
      break;
    }

    case "Base": {
      const baseId = createChildNodeId(parentId, "base");
      const baseNode: Node<PermissionNodeData> = {
        id: baseId,
        type: "permissionBase",
        data: {
          type: "base",
          expression: expr.body,
          label: getBaseConstraintLabel(expr.body),
        },
        position: { x: 0, y: 0 },
      };

      nodes.push(baseNode);
      edges.push({
        id: createEdgeId(parentId, baseId),
        source: parentId,
        target: baseId,
        animated: true,
      });

      convertBaseConstraint(expr.body, baseId, nodes, edges);
      break;
    }
  }
}

function convertNumExpr(
  expr: NumExprType,
  parentId: string,
  nodes: Node<PermissionNodeData>[],
  edges: Edge[],
): void {
  switch (expr.$) {
    case "Add":
    case "Sub": {
      const leftId = createChildNodeId(parentId, "left");
      const rightId = createChildNodeId(parentId, "right");

      const leftNode: Node<PermissionNodeData> = {
        id: leftId,
        type: "permissionNumber",
        data: {
          type: "number",
          expression: expr.left,
          label: getNumExprLabel(expr.left),
        },
        position: { x: 0, y: 0 },
      };

      const rightNode: Node<PermissionNodeData> = {
        id: rightId,
        type: "permissionNumber",
        data: {
          type: "number",
          expression: expr.right,
          label: getNumExprLabel(expr.right),
        },
        position: { x: 0, y: 0 },
      };

      nodes.push(leftNode, rightNode);
      edges.push(
        {
          id: createEdgeId(parentId, leftId),
          source: parentId,
          target: leftId,
          animated: true,
        },
        {
          id: createEdgeId(parentId, rightId),
          source: parentId,
          target: rightId,
          animated: true,
        },
      );

      convertNumExpr(expr.left, leftId, nodes, edges);
      convertNumExpr(expr.right, rightId, nodes, edges);
      break;
    }
  }
}

function convertBaseConstraint(
  expr: BaseConstraintType,
  parentId: string,
  nodes: Node<PermissionNodeData>[],
  edges: Edge[],
): void {
  switch (expr.$) {
    case "InactiveUnlessRedelegated": {
      // This constraint has account and percentage fields but they are leaf nodes
      // No child nodes needed for this simple constraint
      break;
    }
    case "PermissionExists":
    case "PermissionEnabled": {
      // These constraints only have a pid field which is a leaf value
      // No child nodes needed for these simple constraints
      break;
    }
  }
}

function getBoolExprLabel(expr: BoolExprType): string {
  switch (expr.$) {
    case "Not":
      return "NOT";
    case "And":
      return "AND";
    case "Or":
      return "OR";
    case "CompExpr":
      return `Compare (${expr.op})`;
    case "Base":
      return getBaseConstraintLabel(expr.body);
  }
}

function getNumExprLabel(expr: NumExprType): string {
  switch (expr.$) {
    case "UIntLiteral":
      return `Value: ${expr.value.toString()}`;
    case "BlockNumber":
      return "Block Number";
    case "StakeOf":
      return `Stake of ${expr.account}`;
    case "Add":
      return "Add";
    case "Sub":
      return "Subtract";
  }
}

function getBaseConstraintLabel(expr: BaseConstraintType): string {
  switch (expr.$) {
    case "PermissionExists":
      return `Permission Exists: ${expr.pid}`;
    case "PermissionEnabled":
      return `Permission Enabled: ${expr.pid}`;
    case "InactiveUnlessRedelegated":
      return `Inactive Unless Redelegated: ${expr.account} (${expr.percentage}%)`;
  }
}
