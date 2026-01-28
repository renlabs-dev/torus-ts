import type {
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";
import { graph2DConstants } from "./force-graph-2d-constants";

export function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function getNodeRadius(nodeType?: string): number {
  switch (nodeType) {
    case "allocator":
      return graph2DConstants.nodeConfig.nodeGeometry.allocator.radius;
    case "root_agent":
      return graph2DConstants.nodeConfig.nodeGeometry.rootNode.radius;
    case "permission":
      return graph2DConstants.nodeConfig.nodeGeometry.permissionNode.radius;
    case "target_agent":
      return graph2DConstants.nodeConfig.nodeGeometry.targetNode.radius;
    case "signal":
      return graph2DConstants.nodeConfig.nodeGeometry.signalNode.radius;
    default:
      return 10;
  }
}

export function getNodeColor(
  node: CustomGraphNode,
  userAddress?: string,
): string {
  if (userAddress && node.id.toLowerCase() === userAddress.toLowerCase()) {
    return graph2DConstants.nodeConfig.nodeColors.userNode;
  }

  // Determine color by node type (ignore pre-set node.color from 3D constants)
  switch (node.nodeType) {
    case "allocator":
      return graph2DConstants.nodeConfig.nodeColors.allocator;
    case "root_agent":
      return graph2DConstants.nodeConfig.nodeColors.rootNode;
    case "target_agent":
      return graph2DConstants.nodeConfig.nodeColors.targetNode;
    case "permission":
      // Capability permissions with namespace paths get different color
      if (
        node.permissionData?.permissionType === "capability" &&
        node.permissionData.namespacePaths &&
        node.permissionData.namespacePaths.length > 0
      ) {
        return graph2DConstants.nodeConfig.nodeColors.namespacePermissionNode;
      }
      return graph2DConstants.nodeConfig.nodeColors.emissionPermissionNode;
    case "signal":
      return graph2DConstants.nodeConfig.nodeColors.signalNode;
    default:
      return graph2DConstants.nodeConfig.nodeColors.default;
  }
}

export function getNodeBorderColor(
  node: CustomGraphNode,
  userAddress?: string,
): string {
  if (userAddress && node.id.toLowerCase() === userAddress.toLowerCase()) {
    return graph2DConstants.nodeConfig.nodeBorderColors.userNode;
  }

  switch (node.nodeType) {
    case "allocator":
      return graph2DConstants.nodeConfig.nodeBorderColors.allocator;
    case "root_agent":
      return graph2DConstants.nodeConfig.nodeBorderColors.rootNode;
    case "target_agent":
      return graph2DConstants.nodeConfig.nodeBorderColors.targetNode;
    case "permission":
      // Capability permissions with namespace paths get different color
      if (
        node.permissionData?.permissionType === "capability" &&
        node.permissionData.namespacePaths &&
        node.permissionData.namespacePaths.length > 0
      ) {
        return graph2DConstants.nodeConfig.nodeBorderColors
          .namespacePermissionNode;
      }
      return graph2DConstants.nodeConfig.nodeBorderColors
        .emissionPermissionNode;
    case "signal":
      return graph2DConstants.nodeConfig.nodeBorderColors.signalNode;
    default:
      return graph2DConstants.nodeConfig.nodeBorderColors.default;
  }
}

export function getNodeGlowColor(
  node: CustomGraphNode,
  userAddress?: string,
): string {
  if (userAddress && node.id.toLowerCase() === userAddress.toLowerCase()) {
    return graph2DConstants.nodeConfig.nodeGlowColors.userNode;
  }

  switch (node.nodeType) {
    case "allocator":
      return graph2DConstants.nodeConfig.nodeGlowColors.allocator;
    case "root_agent":
      return graph2DConstants.nodeConfig.nodeGlowColors.rootNode;
    case "target_agent":
      return graph2DConstants.nodeConfig.nodeGlowColors.targetNode;
    case "permission":
      // Capability permissions with namespace paths get different color
      if (
        node.permissionData?.permissionType === "capability" &&
        node.permissionData.namespacePaths &&
        node.permissionData.namespacePaths.length > 0
      ) {
        return graph2DConstants.nodeConfig.nodeGlowColors
          .namespacePermissionNode;
      }
      return graph2DConstants.nodeConfig.nodeGlowColors.emissionPermissionNode;
    case "signal":
      return graph2DConstants.nodeConfig.nodeGlowColors.signalNode;
    default:
      return graph2DConstants.nodeConfig.nodeGlowColors.default;
  }
}

export function getLinkColor(
  link: CustomGraphLink,
  nodes: CustomGraphNode[],
): string {
  const sourceId =
    typeof link.source === "string"
      ? link.source
      : (link.source as { id: string }).id;

  const sourceNode = nodes.find((n) => n.id === sourceId);

  // Permission-related links get orange color
  if (
    link.linkType === "permission_grant" ||
    link.linkType === "permission_receive"
  ) {
    // Capability permissions with namespace paths get different color
    if (
      sourceNode?.permissionData?.permissionType === "capability" &&
      sourceNode.permissionData.namespacePaths &&
      sourceNode.permissionData.namespacePaths.length > 0
    ) {
      return graph2DConstants.linkConfig.linkColors.namespacePermissionLink;
    }
    return graph2DConstants.linkConfig.linkColors.emissionPermissionLink;
  }

  // Signal links
  if (link.linkType === "signal") {
    return graph2DConstants.linkConfig.linkColors.signalLink;
  }

  // Default causal/hierarchy links
  return graph2DConstants.linkConfig.linkColors.causalLink;
}

export function getNodeTooltipText(node: CustomGraphNode): string {
  switch (node.nodeType) {
    case "allocator":
      return node.name || node.id;
    case "root_agent":
      return node.name || node.id;
    case "target_agent":
      return node.name || node.id;
    case "permission":
      return "Permission Node";
    case "signal":
      return "Signal Node";
    default:
      return `Node: ${node.name || node.id}`;
  }
}

export function getConnectedNodesSwarm(
  selectedNodeId: string,
  nodes: CustomGraphNode[],
  links: CustomGraphLink[],
  allocatorAddress: string,
): Set<string> {
  const visited = new Set<string>();
  const toVisit = [selectedNodeId];

  visited.add(allocatorAddress);
  visited.add(selectedNodeId);

  while (toVisit.length > 0) {
    const currentNodeId = toVisit.pop();
    if (!currentNodeId) continue;

    const connectedLinks = links.filter((link) => {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : (link.source as { id: string }).id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : (link.target as { id: string }).id;
      return sourceId === currentNodeId || targetId === currentNodeId;
    });

    connectedLinks.forEach((link) => {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : (link.source as { id: string }).id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : (link.target as { id: string }).id;

      const connectedNodeId = sourceId === currentNodeId ? targetId : sourceId;

      if (!visited.has(connectedNodeId)) {
        visited.add(connectedNodeId);

        const connectedNode = nodes.find((n) => n.id === connectedNodeId);
        if (connectedNode && connectedNode.nodeType !== "signal") {
          toVisit.push(connectedNodeId);
        }
      }
    });
  }

  return visited;
}

export function createTooltipElement(): HTMLDivElement {
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  tooltip.style.color = "white";
  tooltip.style.padding = "8px 12px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "14px";
  tooltip.style.fontFamily = "monospace";
  tooltip.style.pointerEvents = "none";
  tooltip.style.zIndex = "40";
  tooltip.style.display = "none";
  tooltip.style.maxWidth = "200px";
  tooltip.style.wordWrap = "break-word";
  document.body.appendChild(tooltip);
  return tooltip;
}

export interface SwarmInfo {
  id: string;
  rootAgentId: string;
  rootAgentName: string;
  connectedNodeIds: Set<string>;
  nodeCount: number;
  permissionTypes: string[];
}

export function getAvailableSwarms(
  nodes: CustomGraphNode[],
  links: CustomGraphLink[],
  allocatorAddress: string,
): SwarmInfo[] {
  const swarms: SwarmInfo[] = [];
  const processedAgents = new Set<string>();

  // Find all agent nodes that could be swarm roots
  const agentNodes = nodes.filter(
    (node) =>
      (node.nodeType === "root_agent" || node.nodeType === "target_agent") &&
      node.id !== allocatorAddress,
  );

  agentNodes.forEach((agent) => {
    if (processedAgents.has(agent.id)) return;

    // Get connected nodes for this potential root agent
    const connectedNodes = getConnectedNodesSwarm(
      agent.id,
      nodes,
      links,
      allocatorAddress,
    );

    // A valid swarm should have at least 3 nodes (root + permission + target minimum)
    if (connectedNodes.size < 3) return;

    // Find permission types involved in this swarm
    const swarmPermissionTypes = new Set<string>();

    links.forEach((link) => {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : (link.source as { id: string }).id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : (link.target as { id: string }).id;

      if (connectedNodes.has(sourceId) || connectedNodes.has(targetId)) {
        if (
          link.linkType === "permission_grant" ||
          link.linkType === "permission_receive"
        ) {
          const permissionNode = nodes.find(
            (n) =>
              (n.id === sourceId || n.id === targetId) &&
              n.nodeType === "permission",
          );
          if (permissionNode?.permissionData) {
            swarmPermissionTypes.add(
              permissionNode.permissionData.permissionType,
            );
          }
        }
      }
    });

    // Mark all nodes in this swarm as processed to avoid duplicates
    connectedNodes.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (
        node &&
        (node.nodeType === "root_agent" || node.nodeType === "target_agent")
      ) {
        processedAgents.add(nodeId);
      }
    });

    swarms.push({
      id: `swarm-${agent.id}`,
      rootAgentId: agent.id,
      rootAgentName: agent.name || agent.id,
      connectedNodeIds: connectedNodes,
      nodeCount: connectedNodes.size,
      permissionTypes: Array.from(swarmPermissionTypes),
    });
  });

  // Sort swarms by node count (larger swarms first)
  return swarms.sort((a, b) => b.nodeCount - a.nodeCount);
}
