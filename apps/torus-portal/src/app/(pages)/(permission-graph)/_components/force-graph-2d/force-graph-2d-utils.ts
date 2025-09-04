import { graphConstants } from "../force-graph/force-graph-constants";
import type {
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";

export function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function getNodeRadius(nodeType?: string): number {
  switch (nodeType) {
    case "allocator":
      return graphConstants.nodeConfig.nodeGeometry.allocator.radius;
    case "root_agent":
      return graphConstants.nodeConfig.nodeGeometry.rootNode.radius;
    case "permission":
      return graphConstants.nodeConfig.nodeGeometry.permissionNode.radius;
    case "target_agent":
      return graphConstants.nodeConfig.nodeGeometry.targetNode.radius;
    case "signal":
      return graphConstants.nodeConfig.nodeGeometry.signalNode.radius;
    default:
      return 10;
  }
}

export function getNodeColor(
  node: CustomGraphNode,
  userAddress?: string,
): string {
  if (userAddress && node.id.toLowerCase() === userAddress.toLowerCase()) {
    return graphConstants.nodeConfig.nodeColors.userNode;
  }
  return node.color ?? graphConstants.nodeConfig.nodeColors.default;
}

export function getNodeTooltipText(node: CustomGraphNode): string {
  switch (node.nodeType) {
    case "allocator":
      return `Allocator: ${node.name || node.id}`;
    case "root_agent":
      return `Root Agent: ${node.name || node.id}`;
    case "target_agent":
      return `Target Agent: ${node.name || node.id}`;
    case "permission":
      return `Permission: ${node.id}`;
    case "signal":
      return `Signal: ${node.name || node.id}`;
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
  tooltip.style.zIndex = "1000";
  tooltip.style.display = "none";
  tooltip.style.maxWidth = "200px";
  tooltip.style.wordWrap = "break-word";
  document.body.appendChild(tooltip);
  return tooltip;
}

export function showTooltip(
  tooltip: HTMLDivElement,
  node: CustomGraphNode,
  x: number,
  y: number,
): void {
  tooltip.textContent = getNodeTooltipText(node);
  tooltip.style.display = "block";
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y - 10}px`;
}

export function updateTooltipPosition(
  tooltip: HTMLDivElement,
  x: number,
  y: number,
): void {
  if (tooltip.style.display === "block") {
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y - 10}px`;
  }
}

export function hideTooltip(tooltip: HTMLDivElement): void {
  tooltip.style.display = "none";
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
  const agentNodes = nodes.filter((node) => 
    (node.nodeType === "root_agent" || node.nodeType === "target_agent") && 
    node.id !== allocatorAddress
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
      const sourceId = typeof link.source === "string" 
        ? link.source 
        : (link.source as { id: string }).id;
      const targetId = typeof link.target === "string" 
        ? link.target 
        : (link.target as { id: string }).id;

      if (connectedNodes.has(sourceId) || connectedNodes.has(targetId)) {
        if (link.linkType === "permission_grant" || link.linkType === "permission_receive") {
          const permissionNode = nodes.find(n => 
            (n.id === sourceId || n.id === targetId) && n.nodeType === "permission"
          );
          if (permissionNode?.permissionData) {
            swarmPermissionTypes.add(permissionNode.permissionData.permissionType);
          }
        }
      }
    });

    // Mark all nodes in this swarm as processed to avoid duplicates
    connectedNodes.forEach((nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && (node.nodeType === "root_agent" || node.nodeType === "target_agent")) {
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
