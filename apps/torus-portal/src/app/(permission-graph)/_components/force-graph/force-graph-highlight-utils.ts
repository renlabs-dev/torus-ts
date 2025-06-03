import type { NodeObject, LinkObject } from "r3f-forcegraph";
import type { CustomGraphLink } from "../permission-graph-types";
import { GRAPH_CONSTANTS } from "./force-graph-constants";

export interface HighlightState {
  highlightNodes: Set<string>;
  highlightLinks: Set<string>;
  hoverNode: string | null;
}

export function createNeighborMap(
  links: CustomGraphLink[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  links.forEach((link) => {
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
    const sourceId =
      typeof link.source === "object" ? link.source.id : link.source;
    const targetId =
      typeof link.target === "object" ? link.target.id : link.target;

    if (sourceId === nodeId || targetId === nodeId) {
      newHighlightLinks.add(`${sourceId}-${targetId}`);
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

  const sourceId =
    typeof link.source === "object"
      ? String(link.source.id)
      : String(link.source);
  const targetId =
    typeof link.target === "object"
      ? String(link.target.id)
      : String(link.target);

  newHighlightLinks.add(`${sourceId}-${targetId}`);
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

export function getLinkParticles(
  link: LinkObject,
  highlightState: HighlightState,
): number {
  const sourceId =
    typeof link.source === "object"
      ? String(link.source.id)
      : String(link.source);
  const targetId =
    typeof link.target === "object"
      ? String(link.target.id)
      : String(link.target);
  const linkId = `${sourceId}-${targetId}`;
  const baseParticles = Number(link.linkDirectionalParticles ?? 0);

  if (highlightState.highlightLinks.has(linkId)) {
    return Math.max(
      baseParticles + GRAPH_CONSTANTS.HIGHLIGHT_PARTICLES_INCREASE,
      GRAPH_CONSTANTS.MIN_PARTICLES,
    );
  }

  return baseParticles;
}

export function getLinkWidth(
  link: LinkObject,
  highlightState: HighlightState,
): number {
  const sourceId =
    typeof link.source === "object"
      ? String(link.source.id)
      : String(link.source);
  const targetId =
    typeof link.target === "object"
      ? String(link.target.id)
      : String(link.target);
  const linkId = `${sourceId}-${targetId}`;
  const baseWidth = Number(link.linkWidth ?? 1);

  if (highlightState.highlightLinks.has(linkId)) {
    return baseWidth * GRAPH_CONSTANTS.HIGHLIGHT_LINK_WIDTH_MULTIPLIER;
  }

  return baseWidth;
}

function lightenColor(color: string, factor: number): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
