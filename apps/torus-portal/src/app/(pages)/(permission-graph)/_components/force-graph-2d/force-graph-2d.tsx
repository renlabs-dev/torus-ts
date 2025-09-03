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
import { graphConstants } from "../force-graph/force-graph-constants";
import type {
  CustomGraphData,
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";
import {
  createTooltipElement,
  getConnectedNodesSwarm,
  getNodeColor,
  getNodeRadius,
  hexToPixi,
  hideTooltip,
  showTooltip,
  updateTooltipPosition,
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

  // Use external selection state if provided, otherwise use internal state
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<
    string | null
  >(null);
  const selectedNodeId = props.selectedNodeId ?? internalSelectedNodeId;

  // Calculate highlighted nodes when selection changes
  const highlightedNodes = useMemo(() => {
    if (selectedNodeId) {
      return getConnectedNodesSwarm(
        selectedNodeId,
        props.graphData.nodes,
        props.graphData.links,
        props.allocatorAddress,
      );
    }
    return new Set<string>();
  }, [
    selectedNodeId,
    props.graphData.nodes,
    props.graphData.links,
    props.allocatorAddress,
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

    const app = new PIXI.Application();

    await app.init({
      width,
      height,
      resolution: 1,
      antialias: true,
      resizeTo: window,
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

    const allocatorNode = nodes.find((n) => n.id === props.allocatorAddress);
    if (allocatorNode) {
      allocatorNode.fx = width / 2;
      allocatorNode.fy = height / 2;
      allocatorNode.x = width / 2;
      allocatorNode.y = height / 2;
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
      const color = getNodeColor(node, props.userAddress);

      const nodeGraphics = new PIXI.Graphics();
      node.gfx = nodeGraphics;

      // Store reference for dynamic updates
      nodeGraphicsRef.current.set(node.id, nodeGraphics);

      nodeGraphics.alpha = 1.0;

      // Different shapes for different node types
      if (node.nodeType === "permission") {
        // Draw diamond shape for permissions
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
        nodeGraphics
          .poly(points)
          .fill({ color: hexToPixi(color) })
          .stroke({ width: 1, color: 0xd3d3d3 });
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
        nodeGraphics
          .poly(points)
          .fill({ color: hexToPixi(color) })
          .stroke({ width: 1, color: 0xd3d3d3 });
      } else {
        // Draw circle for other node types
        nodeGraphics
          .circle(0, 0, radius)
          .fill({ color: hexToPixi(color) })
          .stroke({ width: 1, color: 0xd3d3d3 });
      }

      // Event handlers
      nodeGraphics.on("click", (e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();

        // Toggle selection: if clicking the same node, deselect it
        const newSelectedId = selectedNodeId === node.id ? null : node.id;

        if (props.onSelectionChange) {
          props.onSelectionChange(newSelectedId);
        } else {
          setInternalSelectedNodeId(newSelectedId);
        }

        onNodeClickRef.current(node);
      });

      // Hover handlers for tooltip
      nodeGraphics.on("pointerover", (e: PIXI.FederatedPointerEvent) => {
        if (tooltipRef.current) {
          showTooltip(tooltipRef.current, node, e.globalX, e.globalY);
        }
      });

      nodeGraphics.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
        if (tooltipRef.current) {
          updateTooltipPosition(tooltipRef.current, e.globalX, e.globalY);
        }
      });

      nodeGraphics.on("pointerout", () => {
        if (tooltipRef.current) {
          hideTooltip(tooltipRef.current);
        }
      });

      viewport.addChild(nodeGraphics);

      nodeGraphics.interactive = true;
      nodeGraphics.cursor = "pointer";
      nodeGraphics.hitArea = new PIXI.Circle(0, 0, radius);
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
          const linkColor = graphConstants.linkConfig.linkColors.defaultLink;
          const linkWidth = graphConstants.linkConfig.linkWidth;

          // Calculate link alpha based on current highlighting state
          const sourceHighlighted = highlightedNodesRef.current.has(source.id);
          const targetHighlighted = highlightedNodesRef.current.has(target.id);
          const hasSelection = selectedNodeIdRef.current !== null;

          let alpha = 0.2;
          if (hasSelection) {
            if (sourceHighlighted && targetHighlighted) {
              alpha = 0.6;
            } else if (sourceHighlighted || targetHighlighted) {
              alpha = 0.3;
            } else {
              alpha = 0.05;
            }
          }

          visualLinks
            .moveTo(source.x, source.y)
            .lineTo(target.x, target.y)
            .stroke({ width: linkWidth, color: hexToPixi(linkColor), alpha });
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

        // Hide tooltip
        if (tooltipRef.current) {
          hideTooltip(tooltipRef.current);
        }
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
          props.graphData.nodes,
          props.graphData.links as D3SimulationLink[],
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
  }, [props.graphData.nodes, props.graphData.links]);

  // Separate effect to update highlighting without re-rendering the graph
  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
    highlightedNodesRef.current = highlightedNodes;

    nodeGraphicsRef.current.forEach((nodeGraphics, nodeId) => {
      const isSelected = selectedNodeId === nodeId;
      const isHighlighted = highlightedNodes.has(nodeId);
      const hasSelection = selectedNodeId !== null;

      let opacity = 1.0;
      if (hasSelection && !isSelected && !isHighlighted) {
        opacity = 0.1;
      }

      nodeGraphics.alpha = opacity;
    });
  }, [selectedNodeId, highlightedNodes]);

  return (
    <div
      ref={containerRef}
      className="bg-background animate-fade animate-delay-1000 fixed inset-0 z-0"
    />
  );
}
