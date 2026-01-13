"use client";

import * as d3 from "d3";
import type {
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force";
import { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { graph2DConstants } from "./force-graph-2d-constants";
import type {
  CustomGraphData,
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";
import {
  createTooltipElement,
  getAvailableSwarms,
  getConnectedNodesSwarm,
  getLinkColor,
  getNodeBorderColor,
  getNodeColor,
  getNodeGlowColor,
  getNodeRadius,
  getNodeTooltipText,
  hexToPixi,
} from "./force-graph-2d-utils";

type D3SimulationNode = CustomGraphNode &
  SimulationNodeDatum & {
    gfx?: PIXI.Graphics;
  };

type D3SimulationLink = CustomGraphLink & SimulationLinkDatum<D3SimulationNode>;

interface ForceGraph2DProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  allocatorAddress: string;
  selectedNodeId?: string | null;
  onSelectionChange?: (nodeId: string | null) => void;
  selectedSwarmId?: string | null;
  swarmCenterNodeId?: string | null;
  /** When true, the graph fits within its parent container instead of being full-screen */
  contained?: boolean;
}

export function ForceGraphCanvas2D(props: ForceGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const simulationRef = useRef<Simulation<
    D3SimulationNode,
    D3SimulationLink
  > | null>(null);
  const onNodeClickRef = useRef(props.onNodeClick);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use external selection state if provided, otherwise use internal state
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<
    string | null
  >(null);
  const selectedNodeId = props.selectedNodeId ?? internalSelectedNodeId;

  // Filter graph data when swarm is selected
  const filteredGraphData = useMemo(() => {
    if (props.selectedSwarmId && props.swarmCenterNodeId) {
      const availableSwarms = getAvailableSwarms(
        props.graphData.nodes,
        props.graphData.links,
        props.allocatorAddress,
      );
      const selectedSwarm = availableSwarms.find(
        (swarm) => swarm.id === props.selectedSwarmId,
      );

      if (selectedSwarm) {
        const swarmNodeIds = selectedSwarm.connectedNodeIds;
        const filteredNodes = props.graphData.nodes.filter(
          (node) =>
            swarmNodeIds.has(node.id) && node.id !== props.allocatorAddress,
        );

        const filteredLinks = props.graphData.links.filter((link) => {
          const sourceId =
            typeof link.source === "string"
              ? link.source
              : (link.source as { id: string }).id;
          const targetId =
            typeof link.target === "string"
              ? link.target
              : (link.target as { id: string }).id;
          return (
            swarmNodeIds.has(sourceId) &&
            swarmNodeIds.has(targetId) &&
            sourceId !== props.allocatorAddress &&
            targetId !== props.allocatorAddress
          );
        });

        return {
          nodes: filteredNodes,
          links: filteredLinks,
        };
      }
    }

    // Return original data if no swarm is selected
    return props.graphData;
  }, [
    props.selectedSwarmId,
    props.swarmCenterNodeId,
    props.graphData,
    props.allocatorAddress,
  ]);

  // Calculate highlighted nodes when selection changes
  const highlightedNodes = useMemo(() => {
    if (selectedNodeId && !props.selectedSwarmId) {
      // Only use highlighting in "All Networks" view, not in swarm view
      return getConnectedNodesSwarm(
        selectedNodeId,
        filteredGraphData.nodes,
        filteredGraphData.links,
        props.allocatorAddress,
      );
    }
    return new Set<string>();
  }, [
    selectedNodeId,
    filteredGraphData.nodes,
    filteredGraphData.links,
    props.allocatorAddress,
    props.selectedSwarmId,
  ]);

  const nodeGraphicsRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const linksGraphicsRef = useRef<PIXI.Graphics | null>(null);

  const selectedNodeIdRef = useRef<string | null>(null);
  const highlightedNodesRef = useRef<Set<string>>(new Set());

  const runForceGraph2D = async (
    container: HTMLDivElement,
    nodesData: D3SimulationNode[],
    linksData: D3SimulationLink[],
  ) => {
    const nodes = nodesData.map((node) => ({
      ...node,
    }));
    const links = linksData.map((link) => ({
      ...link,
    }));

    const containerRect = container.getBoundingClientRect();
    const height = containerRect.height;
    const width = containerRect.width;

    container.innerHTML = "";

    // Clear the node graphics map to avoid stale references
    nodeGraphicsRef.current.clear();

    const app = new PIXI.Application();

    await app.init({
      width,
      height,
      resolution: 1,
      antialias: true,
      resizeTo: props.contained ? container : window,
      backgroundColor: 0x111111,
    });

    container.appendChild(app.canvas);
    appRef.current = app;

    // Create viewport
    const viewport = new Viewport({
      screenWidth: width,
      screenHeight: height,
      worldWidth: width * 4,
      worldHeight: height * 4,
      passiveWheel: false,
      events: app.renderer.events,
    });

    app.stage.addChild(viewport);

    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clampZoom({
        minWidth: width / 4,
        minHeight: height / 4,
      });

    // Determine which node should be centered
    const centerNodeId = props.swarmCenterNodeId || props.allocatorAddress;
    const centerNode = nodes.find((n) => n.id === centerNodeId);

    if (centerNode) {
      centerNode.fx = width / 2;
      centerNode.fy = height / 2;
      centerNode.x = width / 2;
      centerNode.y = height / 2;
    }

    // If we have a swarm center that's different from allocator, unfix the allocator
    if (
      props.swarmCenterNodeId &&
      props.swarmCenterNodeId !== props.allocatorAddress
    ) {
      const allocatorNode = nodes.find((n) => n.id === props.allocatorAddress);
      if (allocatorNode) {
        allocatorNode.fx = undefined;
        allocatorNode.fy = undefined;
      }
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<D3SimulationNode, D3SimulationLink>(links)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;

    const visualLinks = new PIXI.Graphics();
    viewport.addChild(visualLinks);

    // Store reference for dynamic updates
    linksGraphicsRef.current = visualLinks;

    // Create tooltip element
    if (!tooltipRef.current) {
      tooltipRef.current = createTooltipElement();
    }

    // Create nodes
    nodes.forEach((node) => {
      const radius = getNodeRadius(node.nodeType);
      const fillColor = getNodeColor(node, props.userAddress);
      const borderColor = getNodeBorderColor(node, props.userAddress);
      const glowColor = getNodeGlowColor(node, props.userAddress);

      const nodeGraphics = new PIXI.Graphics();
      node.gfx = nodeGraphics;

      // Store reference for dynamic updates
      nodeGraphicsRef.current.set(node.id, nodeGraphics);

      nodeGraphics.alpha = 1.0;

      // Different shapes for different node types with glow effect
      if (node.nodeType === "permission") {
        // Draw diamond shape for permissions (like rectangular nodes in reference)
        const points = [
          0,
          -radius, // top
          radius,
          0, // right
          0,
          radius, // bottom
          -radius,
          0, // left
        ];

        // Subtle outer glow (larger, more transparent)
        const outerGlowPoints = [
          0,
          -(radius + 4),
          radius + 4,
          0,
          0,
          radius + 4,
          -(radius + 4),
          0,
        ];
        nodeGraphics
          .poly(outerGlowPoints)
          .fill({ color: hexToPixi(glowColor), alpha: 0.15 });

        // Inner glow (smaller, slightly more visible)
        const innerGlowPoints = [
          0,
          -(radius + 2),
          radius + 2,
          0,
          0,
          radius + 2,
          -(radius + 2),
          0,
        ];
        nodeGraphics
          .poly(innerGlowPoints)
          .fill({ color: hexToPixi(glowColor), alpha: 0.3 });

        // Main fill
        nodeGraphics
          .poly(points)
          .fill({ color: hexToPixi(fillColor) })
          .stroke({ width: 1.5, color: hexToPixi(borderColor) });
      } else if (node.nodeType === "signal") {
        // Draw triangle for signals
        const points = [
          0,
          -radius, // top
          -radius,
          radius, // bottom left
          radius,
          radius, // bottom right
        ];

        // Subtle outer glow
        const outerGlowPoints = [
          0,
          -(radius + 4),
          -(radius + 4),
          radius + 4,
          radius + 4,
          radius + 4,
        ];
        nodeGraphics
          .poly(outerGlowPoints)
          .fill({ color: hexToPixi(glowColor), alpha: 0.15 });

        // Inner glow
        const innerGlowPoints = [
          0,
          -(radius + 2),
          -(radius + 2),
          radius + 2,
          radius + 2,
          radius + 2,
        ];
        nodeGraphics
          .poly(innerGlowPoints)
          .fill({ color: hexToPixi(glowColor), alpha: 0.3 });

        // Main fill
        nodeGraphics
          .poly(points)
          .fill({ color: hexToPixi(fillColor) })
          .stroke({ width: 1.5, color: hexToPixi(borderColor) });
      } else {
        // Draw circle for other node types (allocator, root_agent, target_agent)

        // Subtle outer glow (larger, more transparent)
        nodeGraphics
          .circle(0, 0, radius + 5)
          .fill({ color: hexToPixi(glowColor), alpha: 0.1 });

        // Inner glow
        nodeGraphics
          .circle(0, 0, radius + 2)
          .fill({ color: hexToPixi(glowColor), alpha: 0.25 });

        // Main fill with border
        nodeGraphics
          .circle(0, 0, radius)
          .fill({ color: hexToPixi(fillColor) })
          .stroke({ width: 2, color: hexToPixi(borderColor) });

        // Inner detail - small circle or dot for tech look
        if (node.nodeType === "allocator") {
          // Allocator gets concentric rings
          nodeGraphics
            .circle(0, 0, radius * 0.6)
            .stroke({ width: 1, color: hexToPixi(borderColor), alpha: 0.7 });
          nodeGraphics
            .circle(0, 0, radius * 0.3)
            .fill({ color: hexToPixi(borderColor) });
        } else {
          // Other nodes get a simple inner dot
          nodeGraphics
            .circle(0, 0, radius * 0.25)
            .fill({ color: hexToPixi(borderColor) });
        }
      }

      nodeGraphics.eventMode = "static";
      nodeGraphics.cursor = "pointer";
      nodeGraphics.hitArea = new PIXI.Circle(0, 0, radius);

      let clickTimeout: NodeJS.Timeout | null = null;
      const handleNodeClick = (e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();

        if (clickTimeout) {
          clearTimeout(clickTimeout);
        }

        clickTimeout = setTimeout(() => {
          const newSelectedId = selectedNodeId === node.id ? null : node.id;

          if (props.onSelectionChange) {
            props.onSelectionChange(newSelectedId);
          } else {
            setInternalSelectedNodeId(newSelectedId);
          }

          onNodeClickRef.current(node);
          clickTimeout = null;
        }, 10);
      };

      nodeGraphics.on("tap", handleNodeClick);
      nodeGraphics.on("click", handleNodeClick);

      nodeGraphics.on("pointerover", (e: PIXI.FederatedPointerEvent) => {
        if (tooltipRef.current) {
          tooltipTimeoutRef.current = setTimeout(() => {
            if (tooltipRef.current) {
              const rect = app.canvas.getBoundingClientRect();
              tooltipRef.current.textContent = getNodeTooltipText(node);
              tooltipRef.current.style.display = "block";
              tooltipRef.current.style.left = `${rect.left + e.globalX + 10}px`;
              tooltipRef.current.style.top = `${rect.top + e.globalY - 10}px`;
            }
          }, 400);
        }
      });

      nodeGraphics.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
        if (tooltipRef.current?.style.display === "block") {
          const rect = app.canvas.getBoundingClientRect();
          tooltipRef.current.style.left = `${rect.left + e.globalX + 10}px`;
          tooltipRef.current.style.top = `${rect.top + e.globalY - 10}px`;
        }
      });

      nodeGraphics.on("pointerout", () => {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      });

      viewport.addChild(nodeGraphics);
    });

    const ticked = () => {
      nodes.forEach((node) => {
        const { x, y } = node;
        const gfx = node.gfx;
        if (gfx && x !== undefined && y !== undefined) {
          gfx.position = new PIXI.Point(x, y);
        }
      });

      // Clear and redraw links
      visualLinks.clear();
      visualLinks.removeChildren();

      links.forEach((link) => {
        const source = link.source as D3SimulationNode;
        const target = link.target as D3SimulationNode;

        if (
          source.x !== undefined &&
          source.y !== undefined &&
          target.x !== undefined &&
          target.y !== undefined
        ) {
          // Get dynamic link color based on link type
          const linkColor = getLinkColor(link, nodes);
          const linkWidth = graph2DConstants.linkConfig.linkWidth;

          // Calculate link alpha based on current highlighting state
          const sourceHighlighted = highlightedNodesRef.current.has(source.id);
          const targetHighlighted = highlightedNodesRef.current.has(target.id);
          const hasSelection = selectedNodeIdRef.current !== null;

          let alpha = 0.8;
          if (hasSelection) {
            if (sourceHighlighted && targetHighlighted) {
              alpha = 0.6;
            } else if (sourceHighlighted || targetHighlighted) {
              alpha = 0.4;
            } else {
              alpha = 0.15;
            }
          }

          const isPermissionLink =
            link.linkType === "permission_grant" ||
            link.linkType === "permission_receive" ||
            link.linkType === "permission_ownership" ||
            link.linkType === "permission_target";

          if (isPermissionLink) {
            // Draw curved lines for permission-related links (like multiway branches in the reference)
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Control point offset perpendicular to the line
            const curveOffset = Math.min(dist * 0.2, 30);
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;

            // Perpendicular direction
            const perpX = -dy / dist;
            const perpY = dx / dist;

            const ctrlX = midX + perpX * curveOffset;
            const ctrlY = midY + perpY * curveOffset;

            visualLinks
              .moveTo(source.x, source.y)
              .quadraticCurveTo(ctrlX, ctrlY, target.x, target.y)
              .stroke({ width: linkWidth, color: hexToPixi(linkColor), alpha });
          } else {
            // Draw straight lines for causal/hierarchy links with arrow
            visualLinks
              .moveTo(source.x, source.y)
              .lineTo(target.x, target.y)
              .stroke({ width: linkWidth, color: hexToPixi(linkColor), alpha });

            // Draw arrow head
            const arrowLength = graph2DConstants.linkConfig.arrowConfig.defaultArrowLength;
            const arrowPos = graph2DConstants.linkConfig.arrowConfig.defaultArrowRelPos;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
              // Arrow position along the line
              const arrowX = source.x + dx * arrowPos;
              const arrowY = source.y + dy * arrowPos;

              // Unit vector
              const ux = dx / dist;
              const uy = dy / dist;

              // Perpendicular vector
              const px = -uy;
              const py = ux;

              // Arrow points
              const arrowPoints = [
                arrowX,
                arrowY,
                arrowX - ux * arrowLength + px * arrowLength * 0.5,
                arrowY - uy * arrowLength + py * arrowLength * 0.5,
                arrowX - ux * arrowLength - px * arrowLength * 0.5,
                arrowY - uy * arrowLength - py * arrowLength * 0.5,
              ];

              visualLinks
                .poly(arrowPoints)
                .fill({ color: hexToPixi(linkColor) });
            }
          }
        }
      });
    };

    simulation.on("tick", ticked);

    // Call the first tick to initialize positions and render
    ticked();

    return {
      destroy: () => {
        simulation.stop();
        nodes.forEach((node) => {
          const gfx = node.gfx;
          if (gfx) {
            gfx.destroy();
          }
        });
        visualLinks.destroy();
        app.destroy(true);
      },
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: { destroy: () => void } | null = null;

    const initGraph = async () => {
      if (containerRef.current) {
        cleanup = await runForceGraph2D(
          containerRef.current,
          filteredGraphData.nodes,
          filteredGraphData.links as D3SimulationLink[],
        );
      }
    };

    void initGraph();

    return () => {
      cleanup?.destroy();

      // Clean up tooltip element
      if (tooltipRef.current) {
        document.body.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredGraphData.nodes,
    filteredGraphData.links,
    props.swarmCenterNodeId,
  ]);

  // Separate effect to update highlighting without re-rendering the graph
  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
    highlightedNodesRef.current = highlightedNodes;

    nodeGraphicsRef.current.forEach((nodeGraphics, nodeId) => {
      const isSelected = selectedNodeId === nodeId;
      const isHighlighted = highlightedNodes.has(nodeId);
      const hasSelection = selectedNodeId !== null;
      const isSwarmView = props.selectedSwarmId !== null;

      let opacity = 1.0;
      if (hasSelection && !isSelected && !isHighlighted && !isSwarmView) {
        opacity = 0.1;
      }

      nodeGraphics.alpha = opacity;
    });
  }, [selectedNodeId, highlightedNodes, props.selectedSwarmId]);

  return (
    <div
      ref={containerRef}
      className={
        props.contained
          ? "bg-background h-full w-full"
          : "bg-background animate-fade animate-delay-1000 fixed inset-0 z-0"
      }
    />
  );
}
