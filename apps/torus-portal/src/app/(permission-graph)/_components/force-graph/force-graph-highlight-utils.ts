import type { NodeObject, LinkObject } from "r3f-forcegraph";
import type { CustomGraphLink } from "../permission-graph-types";
import { GRAPH_CONSTANTS } from "./force-graph-constants";
import { lightenColor } from "../permission-graph-utils";

export interface HighlightState {
  highlightNodes: Set<string>;
  highlightLinks: Set<string>;
  hoverNode: string | null;
}

/**
 * Extracts source and target IDs from a link object, handling both object and string representations.
 */
export function extractLinkIds(link: LinkObject | CustomGraphLink) {
  const sourceId =
    (typeof link.source === "object"
      ? link.source.id
      : link.source
    )?.toString() ?? "";

  const targetId =
    (typeof link.target === "object"
      ? link.target.id
      : link.target
    )?.toString() ?? "";

  const linkId = `${sourceId}-${targetId}`;

  return { sourceId, targetId, linkId };
}

/**
 * Checks if a link connects to a specific node.
 */
export function linkConnectsToNode(
  link: LinkObject | CustomGraphLink,
  nodeId: string,
): boolean {
  const { sourceId, targetId } = extractLinkIds(link);
  return sourceId === nodeId || targetId === nodeId;
}

export function createNeighborMap(
  links: CustomGraphLink[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  links.forEach((link) => {
    const { sourceId, targetId } = extractLinkIds(link);

    if (sourceId && targetId) {
      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());

      map.get(sourceId)?.add(targetId);
      map.get(targetId)?.add(sourceId);
    }
  });

  return map;
}

export function calculateNodeHighlights(
  node: NodeObject,
  neighborMap: Map<string, Set<string>>,
  links: CustomGraphLink[],
): { highlightNodes: Set<string>; highlightLinks: Set<string> } {
  const newHighlightNodes = new Set<string>();
  const newHighlightLinks = new Set<string>();

  const nodeId = String(node.id);
  newHighlightNodes.add(nodeId);

  const neighbors = neighborMap.get(nodeId);
  if (neighbors) {
    neighbors.forEach((neighborId) => newHighlightNodes.add(neighborId));
  }

  links.forEach((link) => {
    if (linkConnectsToNode(link, nodeId)) {
      const { linkId } = extractLinkIds(link);
      newHighlightLinks.add(linkId);
    }
  });

  return {
    highlightNodes: newHighlightNodes,
    highlightLinks: newHighlightLinks,
  };
}

export function calculateLinkHighlights(link: LinkObject): {
  highlightNodes: Set<string>;
  highlightLinks: Set<string>;
} {
  const newHighlightNodes = new Set<string>();
  const newHighlightLinks = new Set<string>();

  const { sourceId, targetId, linkId } = extractLinkIds(link);

  newHighlightLinks.add(linkId);
  newHighlightNodes.add(sourceId);
  newHighlightNodes.add(targetId);

  return {
    highlightNodes: newHighlightNodes,
    highlightLinks: newHighlightLinks,
  };
}

export function getNodeColor(
  node: NodeObject,
  highlightState: HighlightState,
  userAddress?: string,
): string {
  const nodeId = String(node.id);
  const baseColor = String(node.color ?? GRAPH_CONSTANTS.COLORS.DEFAULT);

  if (userAddress && nodeId.toLowerCase() === userAddress.toLowerCase()) {
    return GRAPH_CONSTANTS.COLORS.USER_NODE;
  }

  if (highlightState.highlightNodes.has(nodeId)) {
    const lightenAmount =
      nodeId === highlightState.hoverNode
        ? GRAPH_CONSTANTS.HOVER_NODE_LIGHTEN_AMOUNT
        : GRAPH_CONSTANTS.NEIGHBOR_NODE_LIGHTEN_AMOUNT;
    return lightenColor(baseColor, lightenAmount);
  }

  return baseColor;
}

export function getLinkWidth(
  link: LinkObject,
  highlightState: HighlightState,
): number {
  const { linkId } = extractLinkIds(link);
  const baseWidth = Number(link.linkWidth ?? 1);

  if (highlightState.highlightLinks.has(linkId)) {
    return baseWidth * GRAPH_CONSTANTS.HIGHLIGHT_LINK_WIDTH_MULTIPLIER;
  }

  return baseWidth;
}
